// 機器（Equipment）関連の型定義

// 機器カテゴリーの型定義
export interface EquipmentCategory {
  id: number
  name: string
}

// 機器の型定義
export interface Equipment {
  name: string
  width: number // cm
  height: number // cm
  svg: string
  categoryId: number
  top: number    // 上辺
  bottom: number // 台形の下辺
  fill?: string  // 塗り色
}
