// 配置済み機器の型定義

export interface PlacedEquipment {
  name: string
  width: number
  height: number
  svg: string
  x: number // 荷台内座標（左上原点, cm）
  y: number
  rotation?: number // 回転角（度）
  top?: number // 台形用
  bottom?: number // 台形用
}
