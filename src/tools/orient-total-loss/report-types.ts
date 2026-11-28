export interface SignatureData {
  imageSrc: string | null
  name: string
  date: string
}

export interface DamageData {
  id: number
  text: string
  photos: [string | null, string | null, string | null, string | null]
}

export type TyreKey = 'FrontRhs' | 'FrontLhs' | 'RearRhsIn' | 'RearRhsOut' | 'RearLhsIn' | 'RearLhsOut'

export interface ReportData {
  registrationNo: string
  claimNo: string
  makeModel: string
  chassisNo: string
  importedStatus: string
  yom: string
  policyNo: string
  policyHolder: string
  sumInsured: string
  pav: string
  careDriveValue: string
  godwinYapaValue: string
  deSilvaValue: string
  marketAverage: string
  salvageValue: string
  damages: DamageData[]
  tyres: Record<TyreKey, string>
  tyrePhotos: Record<TyreKey, string | null>
  conclusions: string[]
  finalConclusion: string
  signatures: {
    juniorEngineer: SignatureData
    zonalEngineer: SignatureData
    chiefEngineer: SignatureData
  }
}
