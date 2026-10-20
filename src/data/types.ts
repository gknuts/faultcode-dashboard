export type ISODate = string // 'YYYY-MM-DD'

export interface PatternData {
  assets: Asset[]
  faultCodes: FaultCode[]
  patterns: Pattern[]
  occurrences: PatternOccurrence[]
}

export interface Asset {
  id: string
  label: string
}

export interface FaultCode {
  code: string
  description: string
}

export interface Pattern {
  id: string
  assetId: string
  faultCodes: string[]
  startDate: ISODate
  endDate?: ISODate
}

export interface PatternOccurrence {
  patternId: string
  faultCode: string
  date: ISODate
  count: number
  status: 'abnormal' | 'normal'
}

export type DerivedStatus = 'new' | 'ongoing' | 'resolved' | 'ignored'

export type ViewMode = '3D' | '1W' | '1M'
