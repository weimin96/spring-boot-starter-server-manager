<template>
  <sm-modal :model-value="showModal" @close="abort">
    <template #header>
      {{ state }}
      <template v-if="state === STATE_COMPLETED">
        {{ name }} -
        {{ $t('instances.jolokia.execution_successful') }}
      </template>
      <template v-else>
        {{ name }}
      </template>
    </template>

    <template #body>
      <template v-if="state === STATE_INPUT_ARGS">
        <section @keyup.ctrl.enter="invoke(args)">
          <template v-for="(arg, idx) in descriptor.args" :key="arg.name">
            <sm-input
              v-model="args[idx]"
              :hint="arg.desc !== arg.name ? arg.desc : undefined"
              class="mb-1"
            >
              <template #prepend>
                <span v-text="arg.name" />:&nbsp;
                <small v-text="arg.type" />
              </template>
            </sm-input>
          </template>
        </section>
      </template>

      <template v-else-if="state === STATE_EXECUTING">
        <sm-loading-spinner />
      </template>

      <template v-else-if="state === STATE_COMPLETED">
        <pre
          v-if="descriptor.ret !== 'void'"
          class="overflow-auto text-xs"
          v-text="prettyPrintedResult"
        />
      </template>

      <template v-else-if="state === STATE_FAILED">
        <div class="p-2 mb-2 rounded">
          <strong>
            <font-awesome-icon class="pr-1" icon="exclamation-triangle" />
            <span v-text="$t('instances.jolokia.execution_failed')" />
          </strong>
          <p v-text="error.message" />
        </div>
        <code class="text-xs">
          <pre v-if="error.stacktrace" v-text="error.stacktrace" />
          <pre
            v-if="error.response && error.response.data"
            v-text="error.response.data"
          />
        </code>
      </template>
    </template>

    <template #footer>
      <template v-if="state === STATE_INPUT_ARGS">
        <div class="flex flex-row gap-1">
          <sm-button primary @click="invoke(args)">
            {{ $t('instances.jolokia.execute') }}
          </sm-button>
          <sm-button @click="abort">
            {{ $t('term.cancel') }}
          </sm-button>
        </div>
      </template>

      <template v-else-if="state === STATE_COMPLETED">
        <sm-button primary @click="abort">
          {{ $t('term.close') }}
        </sm-button>
      </template>

      <template v-else-if="state === STATE_FAILED">
        <sm-button primary @click="abort">
          {{ $t('instances.jolokia.close') }}
        </sm-button>
      </template>
    </template>
  </sm-modal>
</template>

<script>
import {
  STATE_COMPLETED,
  STATE_EXECUTING,
  STATE_FAILED,
  STATE_INPUT_ARGS,
  STATE_PREPARED,
  responseHandler,
} from '@/views/instances/jolokia/responseHandler';

export default {
  props: {
    name: {
      type: String,
      required: true,
    },
    descriptor: {
      type: Object,
      required: true,
    },
    value: {
      type: null,
      default: null,
    },
    onClose: {
      type: Function,
      required: true,
    },
    onExecute: {
      type: Function,
      required: true,
    },
  },
  data: () => ({
    state: null,
    error: null,
    args: null,
    result: null,
    showModal: true,
    STATE_EXECUTING,
    STATE_FAILED,
    STATE_INPUT_ARGS,
    STATE_PREPARED,
    STATE_COMPLETED,
  }),
  computed: {
    prettyPrintedResult() {
      if (this.result && typeof this.result === 'string') {
        try {
          const o = JSON.parse(this.result);
          return JSON.stringify(o, undefined, 4);
        } catch {
          return this.result;
        }
      } else if (typeof result === 'object') {
        return JSON.stringify(this.result, undefined, 4);
      }
      return this.result;
    },
  },
  created() {
    this.invoke();
  },
  mounted() {
    document.addEventListener('keyup', this.keyHandler);
  },
  beforeUnmount() {
    document.removeEventListener('keyup', this.keyHandler);
  },
  methods: {
    abort() {
      this.showModal = false;
      this.onClose();
    },
    invoke(args) {
      this.state =
        args || this.descriptor.args.length === 0
          ? STATE_PREPARED
          : STATE_INPUT_ARGS;
      this.args = args || new Array(this.descriptor.args.length);
      this.error = null;
      this.result = null;

      if (this.state === STATE_PREPARED) {
        this.execute();
      }
    },
    async execute() {
      this.state = STATE_EXECUTING;
      try {
        const response = await this.onExecute(this.args);
        const { result, state, error } = responseHandler(response);
        this.result = result;
        this.state = state;
        this.error = error;
      } catch (error) {
        this.state = STATE_FAILED;
        this.error = error;
        console.warn('Invocation failed', error);
      }
    },
    keyHandler(event) {
      if (event.keyCode === 27) {
        this.abort();
      }
    },
  },
};
</script>

<style scoped>
.modal-card-title {
  word-break: break-all;
}
</style>
