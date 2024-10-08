import { AxiosInstance } from 'axios';
import { sortBy } from 'lodash-es';
import { Observable, concat, from, ignoreElements } from 'rxjs';

import axios, { redirectOn401 } from '../utils/axios';
import waitForPolyfill from '../utils/eventsource-polyfill';
import uri from '../utils/uri';
import Instance, { DOWN_STATES, UNKNOWN_STATES, UP_STATES } from './instance';

import ErrorResponse from '@/services/error-response';

const actuatorMimeTypes = [
  'application/vnd.spring-boot.actuator.v2+json',
  'application/vnd.spring-boot.actuator.v1+json',
  'application/json',
];

export const hasMatchingContentType = (contentType, compatibleContentTypes) =>
  Boolean(contentType) &&
  compatibleContentTypes.includes(contentType.replace(/;.*$/, ''));

export const convertBody = (responses) =>
  responses.map((res) => {
    if (
      res.body &&
      hasMatchingContentType(res.contentType, actuatorMimeTypes)
    ) {
      return {
        ...res,
        body: JSON.parse(res.body),
      };
    }
    return res;
  });

export const getStatusInfo = (applications: Application[]) => {
  const instances = applications.flatMap(
    (application) => application.instances,
  );

  const upCount = instances.filter((instance) =>
    UP_STATES.includes(instance.statusInfo.status),
  ).length;

  const downCount = instances.filter((instance) =>
    DOWN_STATES.includes(instance.statusInfo.status),
  ).length;

  const unknownCount = instances.filter((instance) =>
    UNKNOWN_STATES.includes(instance.statusInfo.status),
  ).length;

  return {
    upCount,
    downCount,
    unknownCount,
    allUp: upCount === instances.length,
    allDown: downCount === instances.length,
    allUnknown: unknownCount === instances.length,
    someUnknown: unknownCount > 0 && unknownCount < instances.length,
    someDown: downCount > 0 && downCount < instances.length,
  };
};

class Application {
  public readonly name: string;
  public readonly instances: Instance[];
  public readonly buildVersion? = {} as { value: string };
  public readonly status: string;
  public readonly statusTimestamp: string;

  private readonly axios: AxiosInstance;

  constructor({ name, instances, ...application }) {
    Object.assign(this, application);
    this.name = name;
    this.axios = axios.create({
      baseURL: uri`api/applications/${this.name}`,
      headers: {
        'X-sm-REQUEST': true,
      },
    });
    this.axios.interceptors.response.use(
      (response) => response,
      redirectOn401(),
    );
    this.instances = sortBy(
      instances.map(
        (i) => new Instance(i),
        [(instance) => instance.registration.healthUrl],
      ),
    );
  }

  get isUnregisterable() {
    return this.instances.some((i) => i.isUnregisterable);
  }

  get hasShutdownEndpoint() {
    return this.hasEndpoint('shutdown');
  }

  get hasRestartEndpoint() {
    return this.hasEndpoint('restart');
  }

  static async list() {
    return axios.get('api/applications', {
      headers: { Accept: 'application/json', 'X-sm-REQUEST': true },
      transformResponse: Application._transformResponse,
    });
  }

  static getStream(): Observable<ApplicationStream | unknown> {
    const token = localStorage.getItem('token');
    return concat(
      from(waitForPolyfill()).pipe(ignoreElements()),
      Observable.create((observer) => {
        const eventSource = new EventSource(
          uri`api/applications?Authorization=${token}`,
        );
        eventSource.onmessage = (message) =>
          observer.next({
            ...message,
            data: Application._transformResponse(message.data),
          } as ApplicationStream);

        eventSource.onerror = (err) => {
          observer.error(err);
        };
        return () => eventSource.close();
      }),
    );
  }

  static _transformResponse(data) {
    if (!data) {
      return data;
    }
    const json = JSON.parse(data);
    if (json instanceof Array) {
      const applications = json.map((j) => new Application(j));
      return sortBy(applications, [(item) => item.name]);
    } else if (json instanceof Object) {
      const errorResponse = new ErrorResponse(json);
      if (errorResponse.error == 'Unauthorized') {
        window.location.href = 'login';
        return;
      }
    }
    return new Application(json);
  }

  filterInstances(predicate) {
    return new Application({
      ...this,
      instances: this.instances.filter(predicate),
    });
  }

  hasEndpoint(endpointId) {
    return this.instances.some((i) => i.hasEndpoint(endpointId));
  }

  findInstance(instanceId) {
    return this.instances.find((instance) => instance.getId() === instanceId);
  }

  async unregister() {
    return this.axios.delete('', {
      headers: { Accept: 'application/json' },
    });
  }

  async fetchLoggers() {
    const responses = convertBody(
      (
        await this.axios.get(uri`monitor/loggers`, {
          headers: { Accept: actuatorMimeTypes.join(',') },
        })
      ).data,
    );
    return { responses };
  }

  async configureLogger(name, level) {
    const responses = (
      await this.axios.post(
        uri`monitor/loggers/${name}`,
        level === null ? {} : { configuredLevel: level },
        { headers: { 'Content-Type': 'application/json' } },
      )
    ).data;
    return { responses };
  }

  async setEnv(name, value) {
    return this.axios.post(
      uri`monitor/env`,
      { name, value },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  async resetEnv() {
    return this.axios.delete(uri`monitor/env`);
  }

  async refreshContext() {
    return this.axios.post(uri`monitor/refresh`);
  }

  async clearCaches() {
    return this.axios.delete(uri`monitor/caches`);
  }

  async clearCache(name, cacheManager) {
    return this.axios.delete(uri`monitor/caches/${name}`, {
      params: { cacheManager: cacheManager },
    });
  }

  shutdown() {
    return this.axios.post(uri`monitor/shutdown`);
  }

  restart() {
    return this.axios.post(uri`monitor/restart`);
  }

  async writeMBeanAttribute(domain, mBean, attribute, value) {
    const body = {
      type: 'write',
      mbean: `${domain}:${mBean}`,
      attribute,
      value,
    };
    return this.axios.post(uri`monitor/jolokia`, body, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  async invokeMBeanOperation(domain, mBean, operation, args) {
    const body = {
      type: 'exec',
      mbean: `${domain}:${mBean}`,
      operation,
      arguments: args,
    };
    return this.axios.post(uri`monitor/jolokia`, body, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }
}

export default Application;
