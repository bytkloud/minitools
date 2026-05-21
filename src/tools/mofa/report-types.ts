export interface SignatureData {
  imageSrc: string | null
  date: string
}

export interface ReportData {
  // Header
  salutation: string | null
  settlementBasis: string

  // Vehicle details
  vehicleNo: string
  moi: string
  model: string
  pav: string
  sum: string
  underInsurancePct: string
  underInsuranceAmt: string

  // Offer details (raw number strings for formatting in builder)
  labor: string
  parts: string
  acr: number
  payableAmount: string
  offerAmount: string

  // Conditional items (pre-computed, ordered, numbered from 3 in output)
  items: string[]

  // Notes
  notes: string

  // Signatures
  signatures: {
    areaEngineer: SignatureData
    zonalEngineer: SignatureData
    managerMotor: SignatureData
  }
  visibleSigKeys: ('areaEngineer' | 'zonalEngineer' | 'managerMotor')[]
}
