export type ISODate = string // 'YYYY-MM-DD'

export interface FaultData {
  assets: Asset[]
  faultCodes: FaultCode[]
  groups: Group[]
  occurrences: DailyOccurrence[]
}

export interface Asset {
  id: string
  label: string
}

export interface FaultCode {
  code: string
  description: string
}

export interface Group {
  id: string
  color?: string
}

export interface DailyOccurrence {
  assetId: string
  faultCode: string
  date: ISODate
  count: number
  status: 'abnormal' | 'normal'
  groupId?: string
}

export type BubbleStatus = 'abnormal' | 'normal'

export interface Validation {
  status: BubbleStatus
  validatedAt: string
}

// key = assetId|faultCode
export type RowKey = string
// key = assetId|faultCode|date
export type BubbleKey = string

export function makeRowKey(assetId: string, faultCode: string): RowKey {
  return `${assetId}|${faultCode}`
}

export function makeBubbleKey(assetId: string, faultCode: string, date: ISODate): BubbleKey {
  return `${assetId}|${faultCode}|${date}`
}

export interface Filters {
  validated: boolean
  notValidated: boolean
  interesting: boolean
  notInteresting: boolean
  abnormal: boolean
  normal: boolean
}

export type ViewMode = '1W' | '1M'
