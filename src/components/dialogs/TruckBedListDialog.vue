<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="(value) => emit('update:modelValue', value)"
    max-width="600"
  >
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>荷台一覧</span>
        <v-btn
          color="primary"
          size="small"
          prepend-icon="mdi-plus"
          @click="addNewBed"
        >
          新規追加
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item
            v-for="bed in truckBeds"
            :key="bed.id"
            :class="{ 'bg-blue-grey-lighten-4': bed.id === selectedId }"
          >
            <template v-slot:prepend>
              <v-icon>mdi-truck</v-icon>
            </template>
            <v-list-item-title>{{ bed.name }}</v-list-item-title>
            <v-list-item-subtitle>
              長さ: {{ bed.height }}cm × 幅: {{ bed.width }}cm
            </v-list-item-subtitle>
            <template v-slot:append>
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                @click="editBed(bed.id)"
              ></v-btn>
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                @click="confirmDelete(bed)"
              ></v-btn>
            </template>
          </v-list-item>
        </v-list>
        <v-alert v-if="truckBeds.length === 0" type="info" class="mt-4">
          荷台が登録されていません
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="close">閉じる</v-btn>
      </v-card-actions>
    </v-card>

    <!-- 削除確認ダイアログ -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>荷台削除の確認</v-card-title>
        <v-card-text>
          <span>荷台「{{ deleteTarget?.name }}」を削除しますか？</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="deleteDialog = false">キャンセル</v-btn>
          <v-btn color="error" text @click="executeDelete">削除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue'
import type { TruckBed } from '../../types'

defineProps<{
  modelValue: boolean
  truckBeds: TruckBed[]
  selectedId: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'select': [id: number]
  'edit': [id: number]
  'delete': [id: number]
  'add': []
}>()

// 削除確認ダイアログ用
const deleteDialog = ref(false)
const deleteTarget = ref<TruckBed | null>(null)

function close() {
  emit('update:modelValue', false)
}

function addNewBed() {
  emit('add')
}

function editBed(id: number) {
  emit('edit', id)
}

function confirmDelete(bed: TruckBed) {
  deleteTarget.value = bed
  deleteDialog.value = true
}

function executeDelete() {
  if (deleteTarget.value) {
    emit('delete', deleteTarget.value.id)
    deleteDialog.value = false
    deleteTarget.value = null
  }
}
</script>
