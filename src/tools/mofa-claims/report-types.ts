export interface SignOff {
  name: string
  title: string
  imageSrc: string | null
}

export interface ClosingSignOff {
  imageSrc: string | null
  name: string
  designation: string
}

export interface ReportData {
  refNo: string
  date: string

  to: SignOff[]
  through: SignOff
  from: SignOff

  vehicleNo: string
  claimNo: string
  dateOfAccident: string
  coverFrom: string
  coverTo: string
  sumInsured: string
  valuationAmount: string
  valuationWords: string
  payableAmount: string

  closing: ClosingSignOff
}
