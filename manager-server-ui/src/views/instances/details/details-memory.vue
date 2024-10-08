<template>
  <sm-panel
    v-if="hasLoaded"
    :title="$t('instances.details.memory.title') + `: ${name}`"
  >
    <div>
      <div v-if="current" class="flex w-full">
        <div v-if="current.metaspace" class="flex-1 text-center">
          <p
            id="metrics.metaspace"
            class="font-bold"
            v-text="$t('instances.details.memory.metaspace')"
          />
          <p
            aria-labelledby="metrics.metaspace"
            v-text="prettyBytes(current.metaspace)"
          />
        </div>
        <div class="flex-1 text-center">
          <p
            id="metrics.memory.used"
            class="font-bold"
            v-text="$t('instances.details.memory.used')"
          />
          <p
            aria-labelledby="metrics.memory.used"
            v-text="prettyBytes(current.used)"
          />
        </div>
        <div class="flex-1 text-center">
          <p
            id="metrics.memory.size"
            class="font-bold"
            v-text="$t('instances.details.memory.size')"
          />
          <p
            aria-labelledby="metrics.memory.size"
            v-text="prettyBytes(current.committed)"
          />
        </div>
        <div v-if="current.max >= 0" class="flex-1 text-center">
          <p
            id="metrics.memory.max"
            class="font-bold"
            v-text="$t('instances.details.memory.max')"
          />
          <p
            aria-labelledby="metrics.memory.max"
            v-text="prettyBytes(current.max)"
          />
        </div>
      </div>

      <MemChart v-if="chartData.length > 0" :data="chartData" />
    </div>
  </sm-panel>
</template>

<script lang="ts">
import moment from 'moment';
import prettyBytes from 'pretty-bytes';
import { concatMap, delay, retryWhen, timer } from 'rxjs';
import { take } from 'rxjs/operators';
import { defineComponent } from 'vue';

import SmConfig from '@/main/config';
import subscribing from '@/mixins/subscribing';
import Instance from '@/services/instance';
import MemChart from '@/views/instances/details/mem-chart.vue';

export default defineComponent({
  name: 'DetailsMemory',
  components: { MemChart },
  mixins: [subscribing],
  props: {
    instance: {
      type: Instance,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
  },
  data: () => ({
    hasLoaded: false,
    current: null,
    chartData: [],
  }),
  computed: {
    name() {
      switch (this.type) {
        case 'heap':
          return 'Heap';
        case 'nonheap':
          return 'Non heap';
        default:
          return this.type;
      }
    },
  },
  methods: {
    prettyBytes,
    async fetchMetrics() {
      const responseMax = this.instance.fetchMetric('jvm.memory.max', {
        area: this.type,
      });
      const responseUsed = this.instance.fetchMetric('jvm.memory.used', {
        area: this.type,
      });
      const hasMetaspace = (await responseUsed).data.availableTags.some(
        (tag) => tag.tag === 'id' && tag.values.includes('Metaspace'),
      );
      const responeMetaspace =
        this.type === 'nonheap' && hasMetaspace
          ? this.instance.fetchMetric('jvm.memory.used', {
              area: this.type,
              id: 'Metaspace',
            })
          : null;
      const responseCommitted = this.instance.fetchMetric(
        'jvm.memory.committed',
        { area: this.type },
      );
      return {
        max: (await responseMax).data.measurements[0].value,
        used: (await responseUsed).data.measurements[0].value,
        metaspace: responeMetaspace
          ? (await responeMetaspace).data.measurements[0].value
          : null,
        committed: (await responseCommitted).data.measurements[0].value,
      };
    },
    createSubscription() {
      return timer(0, SmConfig.uiSettings.pollTimer.memory)
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
            this.chartData.push({ ...data, timestamp: moment().valueOf() });
          },
          error: (error) => {
            this.hasLoaded = true;
            console.warn('Fetching memory metrics failed:', error);
            ElMessage.error('加载失败');
          },
        });
    },
  },
});
</script>

<style lang="css">
.memory-current {
  margin-bottom: 0 !important;
}
</style>
