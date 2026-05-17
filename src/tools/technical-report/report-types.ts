export interface SignatureData {
  imageSrc: string | null
  date: string
}

export interface DamageData {
  id: number
  text: string
  photos: [string | null, string | null, string | null, string | null]
}

export interface ReportData {
  vehicleNo: string
  moiNo: string
  chassisNo: string
  makeModel: string
  yom: string
  mileage: string
  sumInsured: string
  pav: string
  marketWebValue: string
  valuationOfficerValue: string
  areaEngineerValue: string
  zonalEngineerValue: string
  salvageValue: string
  wreckValue: string
  damages: DamageData[]
  tyres: {
    FrontRhs: string
    FrontLhs: string
    RearRhsIn: string
    RearRhsOut: string
    RearLhsIn: string
    RearLhsOut: string
  }
  conclusion: string
  signatures: {
    areaEngineer: SignatureData
    zonalEngineer: SignatureData
    managerMotor: SignatureData
  }
}
