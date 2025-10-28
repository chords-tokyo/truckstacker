<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="(value) => emit('update:modelValue', value)"
    max-width="400"
  >
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>
        <span>{{ message }}</span>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="close">キャンセル</v-btn>
        <v-btn :color="confirmColor" text @click="confirm">{{ confirmText }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
defineProps({
  modelValue: Boolean,
  title: String,
  message: String,
  confirmText: {
    type: String,
    default: 'OK',
  },
  confirmColor: {
    type: String,
    default: 'primary',
  },
})
const emit = defineEmits(['update:modelValue', 'confirm'])
function close() {
  emit('update:modelValue', false)
}
function confirm() {
  emit('confirm')
  close()
}
</script>
