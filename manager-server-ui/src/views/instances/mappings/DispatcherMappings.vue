<template>
  <div class="table-container">
    <table class="table w-full">
      <colgroup>
        <col class="w-80" />
        <col class="w-20" />
      </colgroup>
      <template
        v-for="(handlerMappings, dispatcherName) in dispatchers"
        :key="dispatcherName"
      >
        <thead>
          <tr>
            <th colspan="99" v-text="dispatcherName" />
          </tr>
        </thead>
        <tbody>
          <template
            v-for="(mapping, idx) in handlerMappings"
            :key="`${dispatcherName}_${idx}_pattern`"
          >
            <template
              v-if="mapping.details && mapping.details.requestMappingConditions"
            >
              <tr>
                <td
                  :rowspan="
                    2 +
                    countNonEmptyArrays(
                      mapping.details.requestMappingConditions,
                      'methods',
                      'consumes',
                      'produces',
                      'params',
                      'headers',
                    )
                  "
                >
                  <div
                    v-for="pattern in mapping.details.requestMappingConditions
                      .patterns"
                    :key="`${dispatcherName}_${idx}_${pattern}`"
                  >
                    <code v-text="pattern" />
                  </div>
                </td>
              </tr>

              <tr
                v-if="mapping.details.requestMappingConditions.methods.length"
                :key="`${dispatcherName}_${idx}_methods`"
              >
                <th class="is-narrow">
                  <small v-text="$t('instances.mappings.http-verb')" />
                </th>
                <td
                  class="is-breakable"
                  v-text="
                    mapping.details.requestMappingConditions.methods.join(', ')
                  "
                />
              </tr>

              <tr
                v-if="mapping.details.requestMappingConditions.consumes.length"
                :key="`${dispatcherName}_${idx}_consumes`"
              >
                <th class="is-narrow">
                  <small v-text="$t('instances.mappings.consumes')" />
                </th>
                <td
                  class="is-breakable"
                  v-text="
                    mediaTypePredicates(
                      mapping.details.requestMappingConditions.consumes,
                    )
                  "
                />
              </tr>

              <tr
                v-if="mapping.details.requestMappingConditions.produces.length"
                :key="`${dispatcherName}_${idx}_produces`"
              >
                <th class="is-narrow">
                  <small v-text="$t('instances.mappings.produces')" />
                </th>
                <td
                  class="is-breakable"
                  v-text="
                    mediaTypePredicates(
                      mapping.details.requestMappingConditions.produces,
                    )
                  "
                />
              </tr>

              <tr
                v-if="mapping.details.requestMappingConditions.params.length"
                :key="`${dispatcherName}_${idx}_params`"
              >
                <th class="is-narrow">
                  <small v-text="$t('instances.mappings.parameters')" />
                </th>
                <td
                  class="is-breakable"
                  v-text="
                    paramPredicates(
                      mapping.details.requestMappingConditions.params,
                    )
                  "
                />
              </tr>

              <tr
                v-if="mapping.details.requestMappingConditions.headers.length"
                :key="`${dispatcherName}_${idx}_headers`"
              >
                <th class="is-narrow">
                  <small v-text="$t('instances.mappings.headers')" />
                </th>
                <td
                  class="is-breakable"
                  v-text="
                    paramPredicates(
                      mapping.details.requestMappingConditions.headers,
                    )
                  "
                />
              </tr>

              <tr :key="`${dispatcherName}_${idx}_handler`">
                <th class="is-narrow">
                  <small v-text="$t('instances.mappings.handler')" />
                </th>
                <td class="is-breakable" v-text="mapping.handler" />
              </tr>
            </template>
            <tr v-else :key="`${dispatcherName}_${idx}`">
              <td><code v-text="mapping.predicate" /></td>
              <th class="is-narrow is-breakable">
                <small v-text="$t('instances.mappings.handler')" />
              </th>
              <td colspan="4" v-text="mapping.handler" />
            </tr>
          </template>
        </tbody>
      </template>
    </table>
  </div>
</template>
<script>
export default {
  props: {
    dispatchers: {
      type: Object,
      default: () => ({}),
    },
  },
  methods: {
    countNonEmptyArrays(obj, ...keys) {
      return keys.map((key) => obj[key]).filter((a) => a && a.length).length;
    },
    mediaTypePredicates(types) {
      return types
        .map((p) => `${p.negate ? '!' : ''}${p.mediaType}`)
        .join(', ');
    },
    paramPredicates(params) {
      return params
        .map((p) => `${p.name}: ${p.negate ? '!' : ''}${p.value}`)
        .join(', ');
    },
  },
};
</script>
