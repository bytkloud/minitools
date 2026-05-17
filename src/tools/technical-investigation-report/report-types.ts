export interface SignatureData {
  imageSrc: string | null
  date: string
}

export interface ObservationData {
  id: number
  text: string
  photos: [string | null, string | null]
}

export interface ReportData {
  vehicleNo: string
  moiNo: string
  makeModel: string
  acr: string
  accidentDescription: string
  observations: ObservationData[]
  recommendation: string
  signatures: {
    areaEngineer: SignatureData
    zonalEngineer: SignatureData
    managerMotor: SignatureData
  }
}
