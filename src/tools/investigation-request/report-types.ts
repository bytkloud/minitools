export interface ChecklistItem {
  id: string
  label: string
  checked: boolean
}

export interface CustomChecklistItem {
  id: string
  label: string
}

export interface PersonContact {
  name: string
  contacts: string[]
}

export type PhotoSectionKey =
  | 'policyDetails'
  | 'intimationDetails'
  | 'onsiteDetails'
  | 'driverDetails'
  | 'accidentPhotos'

export interface ReportData {
  vehicleNo: string
  moiNo: string
  accidentDate: string
  checklist: ChecklistItem[]
  customItems: CustomChecklistItem[]
  insured: PersonContact
  driver: PersonContact
  assessor: PersonContact
  photos: Record<PhotoSectionKey, string[]>
}
