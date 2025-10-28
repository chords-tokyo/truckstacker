<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="(value) => emit('update:modelValue', value)"
    max-width="400"
  >
    <v-card>
      <v-card-title>
        {{ mode === 'edit' ? '機器編集' : '機器追加' }}
      </v-card-title>
      <v-card-text>
        <v-text-field v-model="localData.name" label="名前" required></v-text-field>
        <v-select
          v-model="localData.categoryId"
          :items="categories"
          item-title="name"
          item-value="id"
          label="カテゴリー"
          required
          style="margin-bottom: 12px;"
        ></v-select>
        <v-text-field v-model.number="localData.top" label="上辺の長さ (cm)" type="number" min="1" step="1" required></v-text-field>
        <v-text-field v-model.number="localData.bottom" label="底辺の長さ (cm)" type="number" min="1" step="1" required></v-text-field>
        <v-text-field v-model.number="localData.height" label="高さ (cm)" type="number" min="1" step="1" required></v-text-field>
        <v-color-picker
          v-model="localData.fill"
          label="色を選択"
          hide-canvas
          hide-sliders
          hide-inputs
          show-swatches
          width="100%"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="close">キャンセル</v-btn>
        <v-btn color="primary" text @click="submit">{{ mode === 'edit' ? '保存' : '追加' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'
const props = defineProps({
  modelValue: Boolean,
  data: {
    type: Object,
    required: true,
  },
  categories: {
    type: Array,
    required: true,
  },
  mode: String,
})
const emit = defineEmits(['update:modelValue', 'submit'])
const localData = ref({ ...props.data })
watch(() => props.data, (val) => {
  localData.value = { ...val }
}, { deep: true })
function close() {
  emit('update:modelValue', false)
}
function submit() {
  emit('submit', { ...localData.value })
  close()
}
</script>
