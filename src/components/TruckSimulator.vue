<template>
  <v-app>
    <v-app-bar :elevation="2" class="bg-primary">
      <v-app-bar-title>
        <img src="/src/assets/logo.svg" alt="TruckStacker" style="height:32px;vertical-align:middle;margin-right:8px;" />
      </v-app-bar-title>
      <template v-slot:append>
        <v-btn @click="onLoadPlacement">配置を読込</v-btn>
        <v-btn @click="onSavePlacement">配置を保存</v-btn>
        <v-btn @click="printTruckBedArea">印刷</v-btn>
      </template>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <v-row>
          <v-col cols="8" class="text-center">
            <v-row>
              <v-col cols="5">
                <v-select
                  label="荷台1を選択"
                  :items="truckBeds"
                  v-model="selectedTruckBedId"
                  item-title="label"
                  item-value="id"
                  prepend-icon="mdi-truck"
                  icon-color="primary"
                  hide-details
                  style="min-width: 200px;"
                />
              </v-col>
              <v-col cols="5">
                <v-select
                  label="荷台2を選択"
                  :items="truckBeds"
                  v-model="selectedTruckBedId2"
                  item-title="label"
                  item-value="id"
                  prepend-icon="mdi-truck"
                  icon-color="secondary"
                  hide-details
                  style="min-width: 200px;"
                  clearable
                />
              </v-col>
              <v-col cols="2" class="d-flex align-center justify-center">
                <v-btn
                  color="primary"
                  size="small"
                  @click="openTruckBedListDialog"
                >
                  荷台一覧
                </v-btn>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" id="print-area">
                <v-row>
                  <v-col cols="6">
                    <!-- 1台目の荷台 -->
                    <div class="flex-grow-1">
                      <div v-if="selectedTruckBedObj" class="d-flex flex-column align-center">
                        <div class="mb-2 text-subtitle-2 text-primary">荷台1</div>
                        <div id="truck-bed-area" class="d-flex ga-8">
                          <div class="mt-2 d-flex flex-column ga-2 no-print">
                            <v-btn size="small" color="secondary" @click="clearDialog = true">クリア1</v-btn>
                          </div>
                          <div id="truck-bed-svg-area">
                            <svg
                              :width="selectedTruckBedObj.width"
                              :height="selectedTruckBedObj.height"
                              :viewBox="`0 0 ${selectedTruckBedObj.width} ${selectedTruckBedObj.height}`"
                            >
                              <rect
                                x="0" y="0"
                                :width="selectedTruckBedObj.width"
                                :height="selectedTruckBedObj.height"
                                fill="#e0e0e0"
                                stroke="#888"
                                stroke-width="1"
                              />
                              <g v-for="(eq, i) in placedEquipments" :key="eq.name + '-' + i"
                                :transform="(() => {
                                  let cx = eq.width / 2;
                                  if (eq.top !== undefined && eq.bottom !== undefined && eq.top !== eq.bottom) {
                                    cx = ((eq.bottom - eq.top) / 2) + eq.top / 2;
                                  }
                                  return `translate(${eq.x},${eq.y}) rotate(${eq.rotation || 0},${cx},${eq.height/2})`;
                                })()"
                                @mousedown="onPlacedMouseDown(i, $event, 1)"
                                @contextmenu.prevent.stop="onPlacedContextMenu(i, $event, 1)"
                                @dblclick.stop.prevent="onPlacedDblClick(i, 1)"
                                :style="{
                                  cursor: 'move',
                                  opacity: (draggingTruck === 1 && draggingIndex === i) 
                                    ? (ghostOpacity < 1 ? 0.5 : 0) 
                                    : 1
                                }"
                              >
                                <g v-html="eq.svg"></g>
                                <text
                                  :x="(eq.top !== undefined && eq.bottom !== undefined && eq.top !== eq.bottom)
                                        ? (((eq.bottom - eq.top) / 2) + eq.top / 2)
                                        : (eq.width / 2)"
                                  :y="eq.height / 2"
                                  text-anchor="middle"
                                  dominant-baseline="middle"
                                  font-size="10"
                                  fill="#222"
                                  style="pointer-events: none; user-select: none;"
                                >
                                  {{ eq.name }}
                                </text>
                              </g>
                            </svg>
                          </div>
                          <div id="truck-bed-text-area" class="d-flex flex-column ga-2 justify-end align-start pa-4 text-caption">
                            <div style="font-weight:bold;">荷台1</div>
                            <div>{{ selectedTruckBedObj.label }}</div>
                            <hr />
                            <div style="font-weight:bold;">選択機器</div>
                            <div v-if="placedEquipments.length === 0" style="color:#aaa;">なし</div>
                            <div v-else class="text-left">
                              <div v-for="(count, name) in equipmentCountMap" :key="name">
                                {{ name }} × {{ count }}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div v-else class="d-flex flex-column align-center">
                        <div class="mb-2 text-subtitle-2 text-grey">荷台1</div>
                        <span style="color:#aaa;">荷台を選択してください</span>
                      </div>
                    </div>
                  </v-col>
                  <v-col cols="6">
                    <!-- 2台目の荷台 -->
                    <div class="flex-grow-1">
                      <div v-if="selectedTruckBedObj2" class="d-flex flex-column align-center">
                        <div class="mb-2 text-subtitle-2 text-secondary">荷台2</div>
                        <div id="truck-bed-area-2" class="d-flex ga-8">
                          <div class="mt-2 d-flex flex-column ga-2 no-print">
                            <v-btn size="small" color="secondary" @click="clearDialog2 = true">クリア2</v-btn>
                          </div>
                          <div id="truck-bed-svg-area-2">
                            <svg
                              :width="selectedTruckBedObj2.width"
                              :height="selectedTruckBedObj2.height"
                              :viewBox="`0 0 ${selectedTruckBedObj2.width} ${selectedTruckBedObj2.height}`"
                            >
                              <rect
                                x="0" y="0"
                                :width="selectedTruckBedObj2.width"
                                :height="selectedTruckBedObj2.height"
                                fill="#f0f0f0"
                                stroke="#888"
                                stroke-width="1"
                              />
                              <g v-for="(eq, i) in placedEquipments2" :key="eq.name + '-' + i"
                                :transform="(() => {
                                  let cx = eq.width / 2;
                                  if (eq.top !== undefined && eq.bottom !== undefined && eq.top !== eq.bottom) {
                                    cx = ((eq.bottom - eq.top) / 2) + eq.top / 2;
                                  }
                                  return `translate(${eq.x},${eq.y}) rotate(${eq.rotation || 0},${cx},${eq.height/2})`;
                                })()"
                                @mousedown="onPlacedMouseDown(i, $event, 2)"
                                @contextmenu.prevent.stop="onPlacedContextMenu(i, $event, 2)"
                                @dblclick.stop.prevent="onPlacedDblClick(i, 2)"
                                :style="{
                                  cursor: 'move',
                                  opacity: (draggingTruck === 2 && draggingIndex === i) 
                                    ? (ghostOpacity < 1 ? 0.5 : 0) 
                                    : 1
                                }"
                              >
                                <g v-html="eq.svg"></g>
                                <text
                                  :x="(eq.top !== undefined && eq.bottom !== undefined && eq.top !== eq.bottom)
                                        ? (((eq.bottom - eq.top) / 2) + eq.top / 2)
                                        : (eq.width / 2)"
                                  :y="eq.height / 2"
                                  text-anchor="middle"
                                  dominant-baseline="middle"
                                  font-size="10"
                                  fill="#222"
                                  style="pointer-events: none; user-select: none;"
                                >
                                  {{ eq.name }}
                                </text>
                              </g>
                            </svg>
                          </div>
                          <div class="d-flex flex-column ga-2 justify-end align-start pa-4 text-caption">
                            <div style="font-weight:bold;">荷台2</div>
                            <div>{{ selectedTruckBedObj2.label }}</div>
                            <hr />
                            <div style="font-weight:bold;">選択機器</div>
                            <div v-if="placedEquipments2.length === 0" style="color:#aaa;">なし</div>
                            <div v-else class="text-left">
                              <div v-for="(count, name) in equipmentCountMap2" :key="name">
                                {{ name }} × {{ count }}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div v-else class="d-flex flex-column align-center">
                        <div class="mb-2 text-subtitle-2 text-grey">荷台2</div>
                        <span style="color:#aaa;">荷台未選択</span>
                      </div>
                    </div>
                  </v-col>
                </v-row>

                <!-- 右クリックメニュー -->
                <div
                  v-if="contextMenu.show"
                  :style="{
                    position: 'fixed',
                    top: contextMenu.y + 'px',
                    left: contextMenu.x + 'px',
                    background: '#fff',
                    border: '1px solid #ccc',
                    zIndex: 1000,
                    minWidth: '100px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    padding: '4px 0',
                    cursor: 'pointer',
                  }"
                >
                  <div @click="deletePlacedEquipment" style="padding: 8px 16px;">削除</div>
                </div>

                <!-- ドラッグ中のゴースト表示 -->
                <div
                  v-if="ghostEquipment"
                  :style="{
                    position: 'fixed',
                    top: ghostPosition.y + 'px',
                    left: ghostPosition.x + 'px',
                    pointerEvents: 'none',
                    zIndex: 9999,
                    opacity: ghostOpacity
                  }"
                >
                  <svg
                    :width="Math.max(ghostEquipment.width, ghostEquipment.height)"
                    :height="Math.max(ghostEquipment.width, ghostEquipment.height)"
                    :viewBox="`0 0 ${ghostEquipment.width} ${ghostEquipment.height}`"
                  >
                    <g :transform="`rotate(${ghostEquipment.rotation || 0},${ghostEquipment.width/2},${ghostEquipment.height/2})`">
                      <g v-html="ghostEquipment.svg"></g>
                      <text
                        :x="(ghostEquipment.top !== undefined && ghostEquipment.bottom !== undefined && ghostEquipment.top !== ghostEquipment.bottom)
                              ? (((ghostEquipment.bottom - ghostEquipment.top) / 2) + ghostEquipment.top / 2)
                              : (ghostEquipment.width / 2)"
                        :y="ghostEquipment.height / 2"
                        text-anchor="middle"
                        dominant-baseline="middle"
                        font-size="10"
                        fill="#222"
                        style="pointer-events: none; user-select: none;"
                      >
                        {{ ghostEquipment.name }}
                      </text>
                    </g>
                  </svg>
                </div>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="4" class="text-center pr-6">
            <p class="text-caption mb-2">
              機材をダブルクリックで荷台に追加できます
            </p>
            <v-card
              min-height="100%"
            >
              <div class="d-flex align-center justify-space-between px-2 py-1">
                <v-tabs
                  v-model="equipmentTab"
                  align-tabs="center"
                  color="primary"
                >
                  <v-tab
                    v-for="value in equipmentCategories"
                    :key="value.id"
                    :value="value.id"
                  >
                    {{ value.name }}
                  </v-tab>
                </v-tabs>
                <div>
                  <v-btn
                    color="secondary"
                    size="small"
                    class="mr-1"
                    @click="categoryListDialog = true"
                  >
                    カテゴリ覧
                  </v-btn>
                  <v-btn
                    color="primary"
                    size="small"
                    @click="openAddEquipmentDialog"
                  >
                    機材追加
                  </v-btn>
                </div>
              </div>
              <v-tabs-window v-model="equipmentTab">
                <v-tabs-window-item
                  v-for="category in equipmentCategories"
                  :key="category.id"
                  :value="category.id"
                >
                  <v-container fluid>
                    <v-row>
                      <v-col cols="12">
                        <div
                          id="equipment-area"
                          class="d-flex justify-start flex-wrap"
                        >
                          <template v-for="(eq, i) in equipments" :key="eq.name + '-' + i">
                            <div
                              v-if="eq.categoryId === category.id"
                              class="w-50 pa-2 d-flex"
                              @contextmenu.prevent.stop="onEquipmentListContextMenu(i, $event)"
                            >
                              <div>
                                <svg
                                  :width="eq.width*0.6 + 12"
                                  :height="eq.height*0.6 + 12"
                                  :viewBox="`-10 -10 ${eq.width + 20} ${eq.height + 20}`"
                                  style="display:inline-block;vertical-align:middle;cursor:pointer;"
                                  @dblclick="addEquipmentToBed(eq)"
                                >
                                  <g v-html="eq.svg"></g>
                                </svg>
                              </div>
                              <div class="text-left">
                                <span class="text-subtitle-2">{{ eq.name }}</span><br>
                                <span class="text-caption">（{{ eq.width }}cm × {{ eq.height }}cm）</span>
                              </div>
                              <!-- 機器一覧用右クリックメニュー -->
                              <div
                                v-if="equipmentListMenu.show"
                                :style="{
                                  position: 'fixed',
                                  top: equipmentListMenu.y + 'px',
                                  left: equipmentListMenu.x + 'px',
                                  background: '#fff',
                                  border: '1px solid #ccc',
                                  zIndex: 2000,
                                  minWidth: '120px',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                  padding: '4px 0',
                                  cursor: 'pointer',
                                }"
                              >
                                <div @click="editEquipment(equipmentListMenu.targetIndex)" style="padding: 8px 16px;">編集</div>
                                <div @click="deleteEquipment(equipmentListMenu.targetIndex)" style="padding: 8px 16px;">削除</div>
                              </div>
                            </div>
                          </template>
                        </div>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-tabs-window-item>
              </v-tabs-window>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- 機器追加ダイアログ -->
    <!-- 荷台追加ダイアログ -->
    <TruckBedDialog
      v-model="addTruckBedDialog"
      :data="newTruckBed"
      @cancel="addTruckBedDialog = false"
      @submit="addNewTruckBed"
      mode="add"
    />
    <EquipmentDialog
      v-model="addEquipmentDialog"
      :data="newEquipment"
      :categories="equipmentCategories"
      @cancel="addEquipmentDialog = false"
      @submit="addNewEquipment"
      mode="add"
    />
    <EquipmentDialog
      v-model="editEquipmentDialog.show"
      :data="editEquipmentDialog.data"
      :categories="equipmentCategories"
      @cancel="editEquipmentDialog.show = false"
      @submit="saveEditEquipment"
      mode="edit"
    />

    <!-- 荷台一覧ダイアログ -->
    <TruckBedListDialog
      v-model="truckBedListDialog"
      :truck-beds="truckBeds"
      :selected-id="selectedTruckBedId"
      @select="selectTruckBedFromList"
      @edit="editTruckBedFromList"
      @delete="deleteTruckBedFromList"
      @add="addTruckBedFromList"
    />

    <!-- 荷台編集ダイアログ -->
    <TruckBedDialog
      v-model="editTruckBedDialog"
      :data="editTruckBedData"
      @cancel="editTruckBedDialog = false"
      @submit="saveEditTruckBed"
      mode="edit"
    />

    <!-- 荷台削除確認ダイアログ -->
    <v-dialog v-model="deleteTruckBedDialog" max-width="400">
      <v-card>
        <v-card-title>荷台削除の確認</v-card-title>
        <v-card-text>
          <span>本当に選択中の荷台を削除しますか？</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="cancelDeleteTruckBed">キャンセル</v-btn>
          <v-btn color="error" text @click="confirmDeleteTruckBed">削除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
      <DeleteDialog
        v-model="deleteTruckBedDialog"
        title="荷台削除の確認"
        message="本当に選択中の荷台を削除しますか？"
        @cancel="cancelDeleteTruckBed"
        @confirm="confirmDeleteTruckBed"
      />

    <!-- クリア確認ダイアログ -->
    <v-dialog v-model="clearDialog" max-width="400">
      <v-card>
        <v-card-title>配置クリアの確認</v-card-title>
        <v-card-text>
          <span>本当に全ての機器を削除しますか？</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="clearDialog = false">キャンセル</v-btn>
          <v-btn color="error" text @click="onConfirmClear">クリア</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
      <ConfirmDialog
        v-model="clearDialog"
        title="配置クリアの確認"
        message="本当に1台目の全ての機器を削除しますか？"
        confirmText="クリア"
        @cancel="clearDialog = false"
        @confirm="onConfirmClear"
      />

    <!-- 2台目クリア確認ダイアログ -->
      <ConfirmDialog
        v-model="clearDialog2"
        title="配置クリアの確認"
        message="本当に2台目の全ての機器を削除しますか？"
        confirmText="クリア"
        @cancel="clearDialog2 = false"
        @confirm="onConfirmClear2"
      />

    <!-- カテゴリ一覧ダイアログ -->
    <v-dialog v-model="categoryListDialog" max-width="400">
      <v-card>
        <v-card-title>カテゴリ一覧</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item v-for="cat in equipmentCategories" :key="cat.id">
              <v-list-item-title>{{ cat.name }}</v-list-item-title>
              <template v-slot:append>
                <v-btn icon size="small" @click="editCategory(cat.id)" variant="text">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon size="small" @click="deleteCategory(cat.id)" variant="text" color="error">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="categoryListDialog = false">閉じる</v-btn>
          <v-btn color="primary" text @click="openAddCategoryDialog">新規追加</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- カテゴリ編集ダイアログ -->
    <v-dialog v-model="editCategoryDialog.show" max-width="400">
      <v-card>
        <v-card-title>カテゴリ名編集</v-card-title>
        <v-card-text>
          <v-text-field v-model="editCategoryDialog.name" label="新しい名前" required></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="editCategoryDialog.show = false">キャンセル</v-btn>
          <v-btn color="primary" text @click="saveEditCategory">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- カテゴリ追加ダイアログ -->
    <v-dialog v-model="addCategoryDialog.show" max-width="400">
      <v-card>
        <v-card-title>新しいカテゴリを追加</v-card-title>
        <v-card-text>
          <v-text-field v-model="addCategoryDialog.name" label="カテゴリ名" required></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="addCategoryDialog.show = false">キャンセル</v-btn>
          <v-btn color="primary" text @click="saveAddCategory">追加</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup lang="ts">
import TruckBedDialog from './dialogs/TruckBedDialog.vue'
import TruckBedListDialog from './dialogs/TruckBedListDialog.vue'
import EquipmentDialog from './dialogs/EquipmentDialog.vue'
import ConfirmDialog from './dialogs/ConfirmDialog.vue'
import DeleteDialog from './dialogs/DeleteDialog.vue'
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { VBtn } from 'vuetify/components'
// TauriファイルAPI
import { readTextFile, writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs'
import { open, save } from '@tauri-apps/plugin-dialog'
import { listen } from '@tauri-apps/api/event'
// 型定義のインポート
import type { TruckBed, EquipmentCategory, Equipment, PlacedEquipment } from '../types'

// デフォルトデータのインポート
import defaultTruckBeds from '../assets/default-data/truck_beds.json'
import defaultEquipments from '../assets/default-data/equipments.json'

// クリア確認ダイアログ用
const clearDialog = ref(false)
const clearDialog2 = ref(false)
// 配置済み機器を全削除（ダイアログOK時のみ）
function onConfirmClear() {
  placedEquipments.value = [];
  clearDialog.value = false;
}

function onConfirmClear2() {
  placedEquipments2.value = [];
  clearDialog2.value = false;
}

// データ定義（型は ../types から読み込み）
let truckBedIdSeed = 1;
const truckBeds = ref<TruckBed[]>([])
const placedEquipments = ref<PlacedEquipment[]>([])
const placedEquipments2 = ref<PlacedEquipment[]>([])

// 機器カテゴリーデータ
const equipmentTab = ref(1)
const equipmentCategories = ref<EquipmentCategory[]>([
  { id: 1, name: 'スピーカー' },
  { id: 2, name: 'アンプ' },
  { id: 3, name: 'その他' },
])

const equipments = ref<Equipment[]>([])

const TRUCK_BEDS_FILE = 'truck_beds.json'
const EQUIPMENTS_FILE = 'equipments.json'

// equipmentsをファイルから読み込む
async function loadEquipments() {
  try {
    const data = await readTextFile(EQUIPMENTS_FILE, { baseDir: BaseDirectory.AppData })
    equipments.value = JSON.parse(data)
  } catch (error) {
    // ファイルが存在しない場合、デフォルトデータを使用
    equipments.value = defaultEquipments
    await saveEquipments()
  }
}

// 荷台をファイルから読み込む
async function loadTruckBeds() {
  try {
    const data = await readTextFile(TRUCK_BEDS_FILE, { baseDir: BaseDirectory.AppData })
    truckBeds.value = JSON.parse(data)
  } catch (error) {
    // ファイルが存在しない場合、デフォルトデータを使用
    truckBeds.value = defaultTruckBeds
    await saveTruckBeds()
  }
}

// truckBedsをファイルに保存
async function saveTruckBeds() {
  try {
    await writeTextFile(TRUCK_BEDS_FILE, JSON.stringify(truckBeds.value), { baseDir: BaseDirectory.AppData })
  } catch (e) {
    alert('荷台データの保存失敗: ' + e);
    console.error('荷台データの保存失敗', e)
  }
}

// equipmentsをファイルに保存
async function saveEquipments() {
  try {
    await writeTextFile(EQUIPMENTS_FILE, JSON.stringify(equipments.value), { baseDir: BaseDirectory.AppData })
  } catch (e) {
    alert('機器データの保存失敗: ' + e);
    console.error('機器データの保存失敗', e)
  }
}

// メニューイベントの処理
async function handleExportData() {
  console.log('📤 エクスポート処理開始');
  try {
    const filePath = await save({
      title: 'データをエクスポート',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      defaultPath: 'truckstacker-data.json',
    });
    if (!filePath) return;

    const exportData = {
      version: '1.0',
      truckBeds: truckBeds.value,
      equipments: equipments.value,
      categories: equipmentCategories.value,
      exportDate: new Date().toISOString(),
    };

    await writeTextFile(filePath, JSON.stringify(exportData, null, 2));
    alert('データをエクスポートしました: ' + filePath);
  } catch (e) {
    alert('エクスポートに失敗しました: ' + e);
  }
}

async function handleImportData() {
  console.log('📥 インポート処理開始');
  try {
    const filePath = await open({
      title: 'データをインポート',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      multiple: false,
    });
    if (!filePath) return;

    const path = Array.isArray(filePath) ? filePath[0] : filePath;
    if (!path) return;

    const text = await readTextFile(path);
    const importData = JSON.parse(text);

    // データの検証と適用
    if (importData.truckBeds && Array.isArray(importData.truckBeds)) {
      truckBeds.value = importData.truckBeds;
      await saveTruckBeds();
    }
    if (importData.equipments && Array.isArray(importData.equipments)) {
      equipments.value = importData.equipments;
      await saveEquipments();
    }
    if (importData.categories && Array.isArray(importData.categories)) {
      equipmentCategories.value = importData.categories;
    }

    alert('データをインポートしました');
  } catch (e) {
    alert('インポートに失敗しました: ' + e);
  }
}

// リスナーのクリーンアップ用
const unlisteners: Array<() => void> = []

// onMountedで読み込み
onMounted(async () => {
  console.log('🚀 コンポーネントマウント開始');
  loadTruckBeds()
  loadEquipments()
  
  // メニューイベントのリスナー登録
  console.log('🎯 メニューイベントリスナー登録中...');
  
  try {
    const unlistenExport = await listen('menu-export-data', (event: any) => {
      console.log('🔥 menu-export-data イベント受信:', event);
      handleExportData()
    })
    console.log('📡 Export リスナー登録完了:', unlistenExport);
    unlisteners.push(unlistenExport)
    
    const unlistenImport = await listen('menu-import-data', (event: any) => {
      console.log('🔥 menu-import-data イベント受信:', event);
      handleImportData()
    })
    console.log('📡 Import リスナー登録完了:', unlistenImport);
    unlisteners.push(unlistenImport)
    
  } catch (error) {
    console.error('❌ イベントリスナー登録エラー:', error);
  }
  
  console.log('✅ メニューイベントリスナー登録完了');
  console.log('🎉 コンポーネントマウント完了');
})

// コンポーネントの破棄時にリスナーをクリーンアップ
onUnmounted(() => {
  console.log('🧹 イベントリスナーのクリーンアップ');
  unlisteners.forEach(unlisten => {
    try {
      unlisten()
    } catch (error) {
      console.error('リスナークリーンアップエラー:', error)
    }
  })
  unlisteners.length = 0
})

// 荷台一覧ダイアログ
const truckBedListDialog = ref(false)

function openTruckBedListDialog() {
  truckBedListDialog.value = true
}

function selectTruckBedFromList(id: number) {
  selectedTruckBedId.value = id
  truckBedListDialog.value = false
}

function editTruckBedFromList(id: number) {
  const idx = truckBeds.value.findIndex(tb => tb.id === id)
  if (idx < 0) return
  const bed = truckBeds.value[idx]
  // オブジェクト全体を置き換えて参照を変更
  Object.assign(editTruckBedData, {
    name: bed.name,
    width: bed.width,
    height: bed.height,
    index: idx,
  })
  // truckBedListDialog.value = false
  editTruckBedDialog.value = true
}

function deleteTruckBedFromList(id: number) {
  const idx = truckBeds.value.findIndex(tb => tb.id === id)
  if (idx < 0) return
  truckBeds.value.splice(idx, 1)
  if (selectedTruckBedId.value === id) {
    selectedTruckBedId.value = truckBeds.value.length > 0 ? truckBeds.value[0].id : null
  }
  saveTruckBeds()
}

function addTruckBedFromList() {
  truckBedListDialog.value = false
  openAddTruckBedDialog()
}

// 荷台編集・削除用ダイアログ/関数
const editTruckBedDialog = ref(false)
const editTruckBedData = reactive({
  name: '',
  width: 200,
  height: 600,
  index: -1,
})
// 荷台削除確認ダイアログ
const deleteTruckBedDialog = ref(false)

// 荷台IDで選択管理
const selectedTruckBedId = ref<number | null>(null)
const selectedTruckBedId2 = ref<number | null>(null)
const selectedTruckBedObj = computed(() => {
  if (selectedTruckBedId.value == null) return null
  return truckBeds.value.find(tb => tb.id === selectedTruckBedId.value) || null
})
const selectedTruckBedObj2 = computed(() => {
  if (selectedTruckBedId2.value == null) return null
  return truckBeds.value.find(tb => tb.id === selectedTruckBedId2.value) || null
})

// function openEditTruckBedDialog() {
//   if (!selectedTruckBedObj.value) return
//   const idx = truckBeds.value.findIndex(tb => tb.id === selectedTruckBedObj.value?.id)
//   if (idx < 0) return
//   editTruckBedData.name = selectedTruckBedObj.value.name
//   editTruckBedData.width = selectedTruckBedObj.value.width
//   editTruckBedData.height = selectedTruckBedObj.value.height
//   editTruckBedData.index = idx
//   editTruckBedDialog.value = true
// }

function saveEditTruckBed(data?: any) {
  const i = editTruckBedData.index
  if (i < 0) return
  const bedData = data || editTruckBedData
  if (!bedData.name || bedData.width <= 0 || bedData.height <= 0) {
    alert('全ての項目を正しく入力してください')
    return
  }
  const label = `${bedData.name}（${bedData.height}cm x ${bedData.width}cm）`
  const oldId = truckBeds.value[i].id
  truckBeds.value[i] = {
    id: oldId,
    name: bedData.name,
    width: bedData.width,
    height: bedData.height,
    label,
  }
  selectedTruckBedId.value = oldId
  editTruckBedDialog.value = false
  saveTruckBeds()
}


// function deleteSelectedTruckBed() {
//   // ダイアログを開くだけ
//   deleteTruckBedDialog.value = true
// }

import { nextTick } from 'vue'
function confirmDeleteTruckBed() {
  if (!selectedTruckBedObj.value) return
  const idx = truckBeds.value.findIndex(tb => tb.id === selectedTruckBedObj.value?.id)
  if (idx < 0) return
  truckBeds.value.splice(idx, 1)
  nextTick(() => {
    selectedTruckBedId.value = null
  })
  placedEquipments.value = []
  deleteTruckBedDialog.value = false
  saveTruckBeds()
}
function cancelDeleteTruckBed() {
  deleteTruckBedDialog.value = false
}

// 荷台追加用ダイアログ
const addTruckBedDialog = ref(false)
const newTruckBed = reactive({
  name: '',
  width: 200,
  height: 600,
})

const draggingIndex = ref<number|null>(null)
const draggingTruck = ref<number|null>(null)
const dragOffset = reactive({ x: 0, y: 0 })
const ghostEquipment = ref<PlacedEquipment | null>(null)
const ghostPosition = reactive({ x: 0, y: 0 })
const ghostOpacity = ref(1)

function onPlacedMouseDown(i: number, e: MouseEvent, truckNum: number) {
  draggingIndex.value = i
  draggingTruck.value = truckNum
  const svg = (e.target as SVGElement).ownerSVGElement
  if (!svg) return
  const rect = svg.getBoundingClientRect()
  
  // 適切な荷台オブジェクトを選択
  const truckBedObj = truckNum === 1 ? selectedTruckBedObj.value : selectedTruckBedObj2.value
  if (!truckBedObj) return
  
  // SVG座標に変換
  const mouseX = ((e.clientX - rect.left) / rect.width) * truckBedObj.width
  const mouseY = ((e.clientY - rect.top) / rect.height) * truckBedObj.height
  
  const equipmentArray = truckNum === 1 ? placedEquipments.value : placedEquipments2.value
  const eq = equipmentArray[i]
  dragOffset.x = mouseX - eq.x
  dragOffset.y = mouseY - eq.y
  
  // ゴースト表示用にデータをコピー
  ghostEquipment.value = { ...eq }
  // クリック位置での相対位置を計算（SVG座標をスクリーン座標に変換）
  const svgRect = svg.getBoundingClientRect()
  const clickOffsetX = ((mouseX - eq.x) / truckBedObj.width) * svgRect.width
  const clickOffsetY = ((mouseY - eq.y) / truckBedObj.height) * svgRect.height
  
  // ゴーストのSVGが正方形になった分の調整
  const maxDimension = Math.max(eq.width, eq.height)
  const offsetAdjustX = (maxDimension - eq.width) / 2
  const offsetAdjustY = (maxDimension - eq.height) / 2
  
  ghostPosition.x = e.clientX - clickOffsetX - offsetAdjustX
  ghostPosition.y = e.clientY - clickOffsetY - offsetAdjustY
  
  // ドラッグ中のテキスト選択を完全に防止
  document.body.style.userSelect = 'none'
  document.body.style.webkitUserSelect = 'none'
  ;(document.body.style as any).mozUserSelect = 'none'
  ;(document.body.style as any).msUserSelect = 'none'
  
  window.addEventListener('mousemove', onPlacedMouseMove)
  window.addEventListener('mouseup', onPlacedMouseUp)
}
function onPlacedMouseMove(e: MouseEvent) {
  if (draggingIndex.value === null || draggingTruck.value === null) return
  
  // ゴースト位置を常に更新（ドラッグオフセットを維持）
  if (ghostEquipment.value) {
    // 元の荷台の参照を取得
    const originSvg = draggingTruck.value === 1 
      ? document.querySelector('#truck-bed-svg-area svg') as SVGSVGElement
      : document.querySelector('#truck-bed-svg-area-2 svg') as SVGSVGElement
    const originTruckBed = draggingTruck.value === 1 ? selectedTruckBedObj.value : selectedTruckBedObj2.value
    
    if (originSvg && originTruckBed) {
      const originRect = originSvg.getBoundingClientRect()
      const clickOffsetX = (dragOffset.x / originTruckBed.width) * originRect.width
      const clickOffsetY = (dragOffset.y / originTruckBed.height) * originRect.height
      
      // ゴーストのSVGが正方形になった分の調整
      const maxDimension = Math.max(ghostEquipment.value.width, ghostEquipment.value.height)
      const offsetAdjustX = (maxDimension - ghostEquipment.value.width) / 2
      const offsetAdjustY = (maxDimension - ghostEquipment.value.height) / 2
      
      ghostPosition.x = e.clientX - clickOffsetX - offsetAdjustX
      ghostPosition.y = e.clientY - clickOffsetY - offsetAdjustY
    }
  }
  
  // 現在ドラッグ中の機材の配列と荷台オブジェクトを取得
  const currentEquipmentArray = draggingTruck.value === 1 ? placedEquipments.value : placedEquipments2.value
  const eq = currentEquipmentArray[draggingIndex.value]
  if (!eq) return

  // マウス位置から荷台を判定
  let targetTruck = draggingTruck.value // デフォルトは現在の荷台
  let targetSvg = draggingTruck.value === 1 
    ? document.querySelector('#truck-bed-svg-area svg') as SVGSVGElement
    : document.querySelector('#truck-bed-svg-area-2 svg') as SVGSVGElement
  let targetTruckBed = draggingTruck.value === 1 ? selectedTruckBedObj.value : selectedTruckBedObj2.value
  
  // 荷台1エリアをチェック
  const svg1 = document.querySelector('#truck-bed-svg-area svg') as SVGSVGElement
  if (svg1 && selectedTruckBedObj.value) {
    const rect1 = svg1.getBoundingClientRect()
    if (e.clientX >= rect1.left && e.clientX <= rect1.right && 
        e.clientY >= rect1.top && e.clientY <= rect1.bottom) {
      targetTruck = 1
      targetSvg = svg1
      targetTruckBed = selectedTruckBedObj.value
    }
  }
  
  // 荷台2エリアをチェック
  const svg2 = document.querySelector('#truck-bed-svg-area-2 svg') as SVGSVGElement
  if (svg2 && selectedTruckBedObj2.value) {
    const rect2 = svg2.getBoundingClientRect()
    if (e.clientX >= rect2.left && e.clientX <= rect2.right && 
        e.clientY >= rect2.top && e.clientY <= rect2.bottom) {
      targetTruck = 2
      targetSvg = svg2
      targetTruckBed = selectedTruckBedObj2.value
    }
  }

  // ゴーストの透明度を設定（機材が荷台からはみ出しているかで変更）
  let isEquipmentFullyInside = false
  
  if (ghostEquipment.value) {
    // ゴーストの境界を計算（回転と正方形SVGを考慮）
    const maxDimension = Math.max(ghostEquipment.value.width, ghostEquipment.value.height)
    const rotation = ghostEquipment.value.rotation || 0
    
    // 回転を考慮した実際のサイズ
    let actualWidth, actualHeight
    if (rotation === 90 || rotation === 270) {
      actualWidth = ghostEquipment.value.height
      actualHeight = ghostEquipment.value.width
    } else {
      actualWidth = ghostEquipment.value.width
      actualHeight = ghostEquipment.value.height
    }
    
    // 正方形SVGの中央に配置された機材の境界
    const offsetX = (maxDimension - actualWidth) / 2
    const offsetY = (maxDimension - actualHeight) / 2
    
    const ghostLeft = ghostPosition.x + offsetX
    const ghostRight = ghostPosition.x + offsetX + actualWidth
    const ghostTop = ghostPosition.y + offsetY
    const ghostBottom = ghostPosition.y + offsetY + actualHeight
    
    // 荷台1エリア内に完全に収まっているかチェック
    if (svg1 && selectedTruckBedObj.value) {
      const rect1 = svg1.getBoundingClientRect()
      if (ghostLeft >= rect1.left && ghostRight <= rect1.right && 
          ghostTop >= rect1.top && ghostBottom <= rect1.bottom) {
        isEquipmentFullyInside = true
      }
    }
    
    // 荷台2エリア内に完全に収まっているかチェック
    if (!isEquipmentFullyInside && svg2 && selectedTruckBedObj2.value) {
      const rect2 = svg2.getBoundingClientRect()
      if (ghostLeft >= rect2.left && ghostRight <= rect2.right && 
          ghostTop >= rect2.top && ghostBottom <= rect2.bottom) {
        isEquipmentFullyInside = true
      }
    }
  }
  
  // 機材が荷台エリア内に完全に収まっていれば不透明、はみ出していれば半透明
  ghostOpacity.value = isEquipmentFullyInside ? 1 : 0.5

  if (!targetSvg || !targetTruckBed) return
  
  const rect = targetSvg.getBoundingClientRect()
  const mouseX = ((e.clientX - rect.left) / rect.width) * targetTruckBed.width
  const mouseY = ((e.clientY - rect.top) / rect.height) * targetTruckBed.height

  // 台形の左右端をSVG描画ロジックと一致させる
  let newX;
  let centerY;
  if (eq.top !== undefined && eq.bottom !== undefined && eq.top !== eq.bottom) {
    // 台形
    const diff = (eq.bottom - eq.top) / 2;
    newX = mouseX - dragOffset.x;
    // 左端: newX + diff >= 0, 右端: newX + eq.bottom - diff <= width
    newX = Math.max(-diff, newX);
    newX = Math.min(targetTruckBed.width - eq.bottom + diff, newX);
    // Y方向は従来通り外接矩形で制限
    const rad = ((eq.rotation || 0) * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const maxW = Math.max(eq.top, eq.bottom);
    const bboxHeight = maxW * sin + eq.height * cos;
    centerY = mouseY - dragOffset.y + eq.height / 2;
    centerY = Math.max(bboxHeight / 2, Math.min(centerY, targetTruckBed.height - bboxHeight / 2));
    eq.x = newX;
    eq.y = centerY - eq.height / 2;
  } else {
    // 長方形
    const rad = ((eq.rotation || 0) * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const bboxWidth = eq.width * cos + eq.height * sin;
    const bboxHeight = eq.width * sin + eq.height * cos;
    let centerX = mouseX - dragOffset.x + eq.width / 2;
    centerY = mouseY - dragOffset.y + eq.height / 2;
    centerX = Math.max(bboxWidth / 2, Math.min(centerX, targetTruckBed.width - bboxWidth / 2));
    centerY = Math.max(bboxHeight / 2, Math.min(centerY, targetTruckBed.height - bboxHeight / 2));
    eq.x = centerX - eq.width / 2;
    eq.y = centerY - eq.height / 2;
  }
  
  // 荷台が変わった場合は機材を移動
  if (targetTruck !== draggingTruck.value) {
    // 元の配列から削除
    currentEquipmentArray.splice(draggingIndex.value, 1)
    
    // 新しい配列に追加
    const newEquipmentArray = targetTruck === 1 ? placedEquipments.value : placedEquipments2.value
    newEquipmentArray.push(eq)
    
    // ドラッグ情報を更新
    draggingTruck.value = targetTruck
    draggingIndex.value = newEquipmentArray.length - 1
  }
}
function onPlacedMouseUp() {
  draggingIndex.value = null
  draggingTruck.value = null
  ghostEquipment.value = null
  ghostOpacity.value = 1
  
  // ドラッグ終了時にテキスト選択を元に戻す
  document.body.style.userSelect = ''
  document.body.style.webkitUserSelect = ''
  ;(document.body.style as any).mozUserSelect = ''
  ;(document.body.style as any).msUserSelect = ''
  
  window.removeEventListener('mousemove', onPlacedMouseMove)
  window.removeEventListener('mouseup', onPlacedMouseUp)
}

// 右クリックメニュー用
const contextMenu = reactive({ show: false, x: 0, y: 0, targetIndex: -1, truckNum: 1 })

function onPlacedContextMenu(i: number, e: MouseEvent, truckNum: number) {
  contextMenu.show = true
  contextMenu.x = e.clientX
  contextMenu.y = e.clientY
  contextMenu.targetIndex = i
  contextMenu.truckNum = truckNum
  document.addEventListener('click', hideContextMenu)
}

function hideContextMenu() {
  contextMenu.show = false
  document.removeEventListener('click', hideContextMenu)
}

function deletePlacedEquipment() {
  if (contextMenu.targetIndex >= 0) {
    const equipmentArray = contextMenu.truckNum === 1 ? placedEquipments.value : placedEquipments2.value
    equipmentArray.splice(contextMenu.targetIndex, 1)
    contextMenu.show = false
  }
}

// 回転用
function onPlacedDblClick(i: number, truckNum: number) {
  // 90度ずつ回転
  const equipmentArray = truckNum === 1 ? placedEquipments.value : placedEquipments2.value
  const eq = equipmentArray[i];
  const current = eq.rotation || 0;
  eq.rotation = (Math.round(current / 90) * 90 + 90) % 360;
}

const addEquipmentDialog = ref(false)
const newEquipment = reactive({
  name: '',
  top: 1000,
  bottom: 1000,
  height: 1000,
  categoryId: 1, // デフォルトでスピーカー
  fill: '#90caf9',
})

function openAddEquipmentDialog() {
  addEquipmentDialog.value = true
  newEquipment.name = ''
  newEquipment.top = 10000
  newEquipment.bottom = 10000
  newEquipment.height = 10000
  newEquipment.categoryId = equipmentCategories.value[0]?.id || 1
  newEquipment.fill = '#90caf9'
}

function addNewEquipment(data?: any) {
  const equipmentData = data || newEquipment
  if (!equipmentData.name || equipmentData.top <= 0 || equipmentData.bottom <= 0 || equipmentData.height <= 0) {
    alert('全ての項目を正しく入力してください')
    return
  }
  const wTop = equipmentData.top
  const wBottom = equipmentData.bottom
  const h = equipmentData.height
  const fill = equipmentData.fill || '#90caf9'
  let svg = ''
  const strokeWidth = 1
  if (wTop !== wBottom) {
    // 台形 - stroke分を考慮してサイズ調整
    const adjustedTop = wTop - strokeWidth
    const adjustedBottom = wBottom - strokeWidth
    const adjustedHeight = h - strokeWidth
    const diff = (adjustedBottom - adjustedTop) / 2
    const points = `${strokeWidth/2},${adjustedHeight + strokeWidth/2} ${adjustedBottom + strokeWidth/2},${adjustedHeight + strokeWidth/2} ${adjustedBottom - diff + strokeWidth/2},${strokeWidth/2} ${diff + strokeWidth/2},${strokeWidth/2}`
    svg = `<polygon points="${points}" fill="${fill}" stroke="#333" stroke-width="${strokeWidth}" />`
  } else {
    // 長方形 - stroke分を考慮してサイズ調整
    const adjustedWidth = wTop - strokeWidth
    const adjustedHeight = h - strokeWidth
    svg = `<polygon points="${strokeWidth/2},${strokeWidth/2} ${adjustedWidth + strokeWidth/2},${strokeWidth/2} ${adjustedWidth + strokeWidth/2},${adjustedHeight + strokeWidth/2} ${strokeWidth/2},${adjustedHeight + strokeWidth/2}" fill="${fill}" stroke="#333" stroke-width="${strokeWidth}" />`
  }
  equipments.value.push({
    name: equipmentData.name,
    width: Math.max(wTop, wBottom),
    height: h,
    svg,
    categoryId: equipmentData.categoryId ?? (equipmentCategories.value[0]?.id || 1),
    top: wTop,
    bottom: wBottom,
    fill,
  })
  addEquipmentDialog.value = false
  saveEquipments()
}

function openAddTruckBedDialog() {
  addTruckBedDialog.value = true
  newTruckBed.name = ''
  newTruckBed.width = 200
  newTruckBed.height = 600
}

function addNewTruckBed(data?: any) {
  const truckBedData = data || newTruckBed
  if (!truckBedData.name || truckBedData.width <= 0 || truckBedData.height <= 0) {
    alert('全ての項目を正しく入力してください')
    return
  }
  const label = `${truckBedData.name}（${truckBedData.height}cm x ${truckBedData.width}cm）`
  const newId = truckBedIdSeed++
  truckBeds.value.push({
    id: newId,
    name: truckBedData.name,
    width: truckBedData.width,
    height: truckBedData.height,
    label,
  })
  addTruckBedDialog.value = false
  selectedTruckBedId.value = newId // 追加直後に新規荷台を選択
  saveTruckBeds()
}

// 機器一覧右クリックメニュー用
const equipmentListMenu = reactive({ show: false, x: 0, y: 0, targetIndex: -1 })

// カテゴリ一覧ダイアログ
const categoryListDialog = ref(false)
const editCategoryDialog = reactive({ show: false, id: null as number | null, name: '' })
const addCategoryDialog = reactive({ show: false, name: '' })

function editCategory(id: number) {
  const cat = equipmentCategories.value.find(c => c.id === id)
  if (!cat) return
  editCategoryDialog.id = id
  editCategoryDialog.name = cat.name
  editCategoryDialog.show = true
}

function saveEditCategory() {
  const id = editCategoryDialog.id
  const name = editCategoryDialog.name.trim()
  if (!name) return
  const cat = equipmentCategories.value.find(c => c.id === id)
  if (cat) cat.name = name
  editCategoryDialog.show = false
}

function deleteCategory(id: number) {
  equipmentCategories.value = equipmentCategories.value.filter(c => c.id !== id)
  equipments.value = equipments.value.filter(eq => eq.categoryId !== id)
  if (equipmentTab.value === id) {
    equipmentTab.value = equipmentCategories.value[0]?.id || 1
  }
}

function openAddCategoryDialog() {
  addCategoryDialog.show = true
  addCategoryDialog.name = ''
}

function saveAddCategory() {
  const name = addCategoryDialog.name.trim()
  if (!name) return
  const newId = Math.max(...equipmentCategories.value.map(c => c.id), 0) + 1
  equipmentCategories.value.push({ id: newId, name })
  addCategoryDialog.show = false
}

function onEquipmentListContextMenu(i: number, e: MouseEvent) {
  equipmentListMenu.show = true
  equipmentListMenu.x = e.clientX
  equipmentListMenu.y = e.clientY
  equipmentListMenu.targetIndex = i
  document.addEventListener('click', hideEquipmentListMenu)
}

function hideEquipmentListMenu() {
  equipmentListMenu.show = false
  document.removeEventListener('click', hideEquipmentListMenu)
}

// 機器を荷台に追加
function addEquipmentToBed(equipment: Equipment, truckNum?: number) {
  // 荷台が選択されているかチェック
  let targetTruck = truckNum
  if (!targetTruck) {
    // 自動選択：1台目が選択されていれば1台目、なければ2台目
    if (selectedTruckBedObj.value) {
      targetTruck = 1
    } else if (selectedTruckBedObj2.value) {
      targetTruck = 2
    } else {
      alert('荷台を選択してください')
      return
    }
  }

  const truckBedObj = targetTruck === 1 ? selectedTruckBedObj.value : selectedTruckBedObj2.value
  const equipmentArray = targetTruck === 1 ? placedEquipments.value : placedEquipments2.value
  
  if (!truckBedObj) {
    alert(`${targetTruck}台目の荷台を選択してください`)
    return
  }

  const placed: PlacedEquipment = {
    name: equipment.name,
    width: equipment.width,
    height: equipment.height,
    svg: equipment.svg,
    x: (truckBedObj.width - equipment.width) / 2,
    y: (truckBedObj.height - equipment.height) / 2,
    rotation: 0,
    top: equipment.top,
    bottom: equipment.bottom,
  }
  equipmentArray.push(placed)
}

const editEquipmentDialog = reactive({
  show: false,
  index: -1,
  data: { name: '', top: 100, bottom: 100, height: 100, categoryId: 1, fill: '#90caf9' },
})

function editEquipment(i: number) {
  equipmentListMenu.show = false
  if (i < 0) return
  const eq = equipments.value[i]
  editEquipmentDialog.index = i
  editEquipmentDialog.data = {
    name: eq.name,
    top: eq.top,
    bottom: eq.bottom,
    height: eq.height,
    categoryId: eq.categoryId ?? (equipmentCategories.value[0]?.id || 1),
    fill: eq.fill || '#90caf9'
  }
  editEquipmentDialog.show = true
}

function saveEditEquipment(data?: any) {
  const i = editEquipmentDialog.index
  if (i < 0) return
  const d = data || editEquipmentDialog.data
  if (!d.name || d.top <= 0 || d.bottom <= 0 || d.height <= 0) {
    alert('全ての項目を正しく入力してください')
    return
  }
  const old = equipments.value[i]
  const wTop = d.top
  const wBottom = d.bottom
  const h = d.height
  const fill = d.fill || '#90caf9'
  const newWidth = Math.max(wTop, wBottom)
  const newHeight = h
  let newSvg = old.svg
  // SVG再生成: 台形/長方形を判定
  const strokeWidth = 1
  if (wTop !== wBottom) {
    // 台形 - stroke分を考慮してサイズ調整
    const adjustedTop = wTop - strokeWidth
    const adjustedBottom = wBottom - strokeWidth
    const adjustedHeight = h - strokeWidth
    const diff = (adjustedBottom - adjustedTop) / 2
    const points = `${strokeWidth/2},${adjustedHeight + strokeWidth/2} ${adjustedBottom + strokeWidth/2},${adjustedHeight + strokeWidth/2} ${adjustedBottom - diff + strokeWidth/2},${strokeWidth/2} ${diff + strokeWidth/2},${strokeWidth/2}`
    newSvg = `<polygon points="${points}" fill="${fill}" stroke="#333" stroke-width="${strokeWidth}" />`
  } else {
    // 長方形 - stroke分を考慮してサイズ調整
    const adjustedWidth = wTop - strokeWidth
    const adjustedHeight = h - strokeWidth
    newSvg = `<polygon points="${strokeWidth/2},${strokeWidth/2} ${adjustedWidth + strokeWidth/2},${strokeWidth/2} ${adjustedWidth + strokeWidth/2},${adjustedHeight + strokeWidth/2} ${strokeWidth/2},${adjustedHeight + strokeWidth/2}" fill="${fill}" stroke="#333" stroke-width="${strokeWidth}" />`
  }
  equipments.value[i] = {
    name: d.name,
    width: newWidth,
    height: newHeight,
    svg: newSvg,
    categoryId: d.categoryId ?? (equipmentCategories.value[0]?.id || 1),
    top: wTop,
    bottom: wBottom,
    fill,
  }

  // 配置済み機器も寸法変更・自動再配置
  if (selectedTruckBedObj.value) {
    placedEquipments.value.forEach(eq => {
      if (eq.name === d.name) {
        eq.width = newWidth
        eq.height = newHeight
        eq.svg = newSvg
        eq.top = wTop
        eq.bottom = wBottom
        // 回転を考慮した外接矩形
        const rad = ((eq.rotation || 0) * Math.PI) / 180
        const cos = Math.abs(Math.cos(rad))
        const sin = Math.abs(Math.sin(rad))
        const bboxWidth = newWidth * cos + newHeight * sin
        const bboxHeight = newWidth * sin + newHeight * cos
        let centerX = eq.x + newWidth / 2
        let centerY = eq.y + newHeight / 2
        if (selectedTruckBedObj.value) {
          centerX = Math.max(bboxWidth / 2, Math.min(centerX, selectedTruckBedObj.value.width - bboxWidth / 2))
          centerY = Math.max(bboxHeight / 2, Math.min(centerY, selectedTruckBedObj.value.height - bboxHeight / 2))
        }
        eq.x = centerX - newWidth / 2
        eq.y = centerY - newHeight / 2
      }
    })
  }
  editEquipmentDialog.show = false
  saveEquipments()
}

function deleteEquipment(i: number) {
  if (i >= 0) {
    const deletedName = equipments.value[i].name
    equipments.value.splice(i, 1)
    // 配置済み機器からも同名のものを削除
    placedEquipments.value = placedEquipments.value.filter(eq => eq.name !== deletedName)
    equipmentListMenu.show = false
    saveEquipments()
  }
}

const equipmentCountMap = computed(() => {
  const map: Record<string, number> = {}
  placedEquipments.value.forEach(eq => {
    if (!map[eq.name]) map[eq.name] = 0
    map[eq.name]++
  })
  return map
})

const equipmentCountMap2 = computed(() => {
  const map: Record<string, number> = {}
  placedEquipments2.value.forEach(eq => {
    if (!map[eq.name]) map[eq.name] = 0
    map[eq.name]++
  })
  return map
})

// truck-bed-area印刷
function printTruckBedArea() {
  const area = document.getElementById('truck-bed-area');
  if (!area) return;
  // 印刷前に一時的に印刷用クラスを付与（将来の拡張用）
  area.classList.add('print-mode');
  window.print();
  setTimeout(() => {
    area.classList.remove('print-mode');
  }, 1000);
}

// 配置状態の手動保存/読込


// 配置と荷台選択情報をまとめて保存/読込
const onSavePlacement = async () => {
  try {
    const filePath = await save({
      title: '配置データの保存',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      defaultPath: 'placement.json',
    });
    if (!filePath) {
      alert('保存をキャンセルしました');
      return;
    }
    // 配置と選択荷台IDをまとめて保存
    const saveObj = {
      selectedTruckBedId: selectedTruckBedId.value,
      placedEquipments: placedEquipments.value,
    };
    await writeTextFile(filePath, JSON.stringify(saveObj, null, 2));
    alert('配置を保存しました: ' + filePath);
  } catch (e) {
    let msg = '';
    if (typeof e === 'object' && e !== null && 'message' in e) {
      msg = (e as any).message;
    } else {
      msg = String(e);
    }
    alert('保存に失敗しました: ' + msg);
    console.error('配置保存エラー', e);
  }
};

const onLoadPlacement = async () => {
  try {
    const filePath = await open({
      title: '配置データの読込',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      multiple: false,
    });
    if (!filePath) return;
    const path = Array.isArray(filePath) ? filePath[0] : filePath;
    if (!path) return;
    const text = await readTextFile(path);
    const obj = JSON.parse(text);
    // 旧形式（配列のみ）もサポート
    if (Array.isArray(obj)) {
      placedEquipments.value = obj;
    } else if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj.placedEquipments)) {
        placedEquipments.value = obj.placedEquipments;
      }
      if ('selectedTruckBedId' in obj) {
        selectedTruckBedId.value = obj.selectedTruckBedId;
      }
    } else {
      throw new Error('不正なデータ形式');
    }
    // alert('配置を読込ました');
  } catch (e) {
    alert('読込に失敗しました: ' + e);
  }
};
</script>

<style>
  /* ドラッグ中のテキスト選択を防止 */
  * {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  /* 入力フィールドでは選択を有効にする */
  input, textarea, [contenteditable] {
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    user-select: text;
  }

  h1 {
    color: #42b983;
  }

  #truck-bed-area, #truck-bed-area-2 {
    margin-top: 20px;
    border: 1px solid #ccc;
    padding: 10px;
    background-color: #f9f9f9;
  }

  @media print {
    body * {
      visibility: hidden !important;
    }
    #print-area, #print-area * {
      visibility: visible !important;
    }
    #print-area .no-print,
    #print-area .no-print * {
      display: none !important;
      visibility: hidden !important;
    }
    #print-area {
      position: absolute !important;
      left: 0;
      top: 0;
      
      width: 100% !important;
      height: 100% !important;
      background: white !important;
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
      padding: 20px !important;
      z-index: 9999 !important;
    }
    #truck-bed-area, #truck-bed-area-2 {
      border: none !important;
      background-color: white !important;
    }
    #truck-bed-svg-area svg, #truck-bed-svg-area-2 svg {
      width: 10cm !important;
      height: auto !important;
    }
    #truck-bed-text-area {
      font-size: 16pt !important;
    }
  }
</style>
