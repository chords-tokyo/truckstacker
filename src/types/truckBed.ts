// トラック荷台の型定義

export interface TruckBed {
  id: number
  name: string
  height: number // cm
  width: number // cm
  label?: string // 表示用
}
