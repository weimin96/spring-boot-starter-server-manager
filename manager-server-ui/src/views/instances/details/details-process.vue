<template>
  <sm-panel v-if="hasLoaded" :title="$t('instances.details.process.title')">
    <div>
      <div class="-mx-4 -my-3">
        <sm-key-value-table :map="tableData">
          <template #uptime="value">
            <process-uptime :value="value.value" />
          </template>
        </sm-key-value-table>
      </div>
    </div>
  </sm-panel>
</template>

<script>
import { take } from 'rxjs/operators';

import SmConfig from '@/main/config';
import subscribing from '@/mixins/subscribing';
import Instance from '@/services/instance';
import { concatMap, delay, retryWhen, timer } from '@/utils/rxjs';
import processUptime from '@/views/instances/details/process-uptime';
import { toMillis } from '@/views/instances/metrics/metric';

export default {
  components: { processUptime },
  mixins: [subscribing],
  props: {
    instance: {
      type: Instance,
      required: true,
    },
  },
  data: () => ({
    hasLoaded: false,
    pid: null,
    uptime: { value: null, baseUnit: null },
    systemCpuLoad: null,
    processCpuLoad: null,
    systemCpuCount: null,
  }),
  computed: {
    tableData() {
      return {
        pid: {
          label: '进程ID',
          value: this.pid,
        },
        uptime: {
          label: '运行时间',
          value: toMillis(this.uptime.value, this.uptime.baseUnit),
        },
        processCpuLoad: {
          label: '进程CPU使用率',
          value: this.processCpuLoad?.toFixed(2) * 100 + '%',
        },
        systemCpuLoad: {
          label: '系统CPU使用率',
          value: this.systemCpuLoad?.toFixed(2) * 100 + '%',
        },
        cpus: {
          label: 'CPU核心数',
          value: this.systemCpuCount,
        },
      };
    },
  },
  created() {
    this.fetchPid();
    this.fetchUptime();
    this.fetchCpuCount();
  },
  methods: {
    toMillis,
    async fetchUptime() {
      try {
        const response = await this.fetchMetric('process.uptime');
        this.uptime = {
          value: response.measurements[0].value,
          baseUnit: response.baseUnit,
        };
      } catch (error) {
        ElMessage.error('加载失败');
        console.warn('Fetching Uptime failed:', error);
      } finally {
        this.hasLoaded = true;
      }
    },
    async fetchPid() {
      if (this.instance.hasEndpoint('env')) {
        try {
          const response = await this.instance.fetchEnv('PID');
          this.pid = response.data.property.value;
        } catch (error) {
          console.warn('Fetching PID failed:', error);
        } finally {
          this.hasLoaded = true;
        }
      }
    },
    async fetchCpuCount() {
      try {
        this.systemCpuCount = (
          await this.fetchMetric('system.cpu.count')
        ).measurements[0].value;
      } catch (error) {
        console.warn('Fetching Cpu Count failed:', error);
      } finally {
        this.hasLoaded = true;
      }
    },
    createSubscription() {
      return timer(0, SmConfig.uiSettings.pollTimer.process)
        .pipe(
          concatMap(this.fetchCpuLoadMetrics),
          retryWhen((err) => {
            return err.pipe(delay(1000), take(5));
          }),
        )
        .subscribe({
          next: (data) => {
            this.processCpuLoad = data.processCpuLoad;
            this.systemCpuLoad = data.systemCpuLoad;
          },
          error: (error) => {
            this.hasLoaded = true;
            console.warn('Fetching CPU Usage metrics failed:', error);
            ElMessage.error('加载失败');
          },
        });
    },
    async fetchCpuLoadMetrics() {
      const fetchProcessCpuLoad = this.fetchMetric('process.cpu.usage');
      const fetchSystemCpuLoad = this.fetchMetric('system.cpu.usage');
      let processCpuLoad;
      let systemCpuLoad;
      try {
        processCpuLoad = (await fetchProcessCpuLoad).measurements[0].value;
      } catch (error) {
        console.warn('Fetching Process CPU Load failed:', error);
      }
      try {
        systemCpuLoad = (await fetchSystemCpuLoad).measurements[0].value;
      } catch (error) {
        console.warn('Fetching Sytem CPU Load failed:', error);
      }
      return {
        processCpuLoad,
        systemCpuLoad,
      };
    },
    async fetchMetric(name) {
      const response = await this.instance.fetchMetric(name);
      return response.data;
    },
  },
};
</script>
