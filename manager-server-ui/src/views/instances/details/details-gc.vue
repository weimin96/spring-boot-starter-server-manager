<template>
  <sm-panel v-if="hasLoaded" :title="$t('instances.details.gc.title')">
    <div v-if="current" class="flex w-full">
      <div class="flex-1 text-center">
        <p class="font-bold" v-text="$t('instances.details.gc.count')" />
        <p v-text="current.count" />
      </div>
      <div class="flex-1 text-center">
        <p
          class="font-bold"
          v-text="$t('instances.details.gc.time_spent_total')"
        />
        <p v-text="`${current.total_time.asSeconds().toFixed(4)}s`" />
      </div>
      <div class="flex-1 text-center">
        <p
          class="font-bold"
          v-text="$t('instances.details.gc.time_spent_max')"
        />
        <p v-text="`${current.max.asSeconds().toFixed(4)}s`" />
      </div>
    </div>
  </sm-panel>
</template>

<script>
import moment from 'moment';
import { take } from 'rxjs/operators';

import SmConfig from '@/main/config';
import subscribing from '@/mixins/subscribing';
import Instance from '@/services/instance';
import { concatMap, delay, retryWhen, timer } from '@/utils/rxjs';
import { toMillis } from '@/views/instances/metrics/metric';

export default {
  mixins: [subscribing],
  props: {
    instance: {
      type: Instance,
      required: true,
    },
  },
  data: () => ({
    hasLoaded: false,
    current: null,
  }),
  methods: {
    async fetchMetrics() {
      const response = await this.instance.fetchMetric('jvm.gc.pause');
      const measurements = response.data.measurements.reduce(
        (current, measurement) => ({
          ...current,
          [measurement.statistic.toLowerCase()]: measurement.value,
        }),
        {},
      );
      return {
        ...measurements,
        total_time: moment.duration(
          toMillis(measurements.total_time, response.baseUnit),
        ),
        max: moment.duration(toMillis(measurements.max, response.baseUnit)),
      };
    },
    createSubscription() {
      return timer(0, SmConfig.uiSettings.pollTimer.gc)
        .pipe(
          concatMap(this.fetchMetrics),
          retryWhen((err) => {
            return err.pipe(delay(1000), take(5));
          }),
        )
        .subscribe({
          next: (data) => {
            this.hasLoaded = true;
            this.current = data;
          },
          error: (error) => {
            this.hasLoaded = true;
            console.warn('Fetching GC metrics failed:', error);
            ElMessage.error(error);
          },
        });
    },
  },
};
</script>
