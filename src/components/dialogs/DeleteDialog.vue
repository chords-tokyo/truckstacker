<template>
  <ConfirmDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="title"
    :message="message"
    confirm-text="削除"
    confirm-color="error"
    @confirm="onConfirm"
  />
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import ConfirmDialog from './ConfirmDialog.vue'
defineProps({
  modelValue: Boolean,
  title: {
    type: String,
    default: '削除の確認',
  },
  message: {
    type: String,
    default: '本当に削除しますか？',
  },
})
const emit = defineEmits(['update:modelValue', 'confirm'])
function onConfirm() {
  emit('confirm')
}
</script>
