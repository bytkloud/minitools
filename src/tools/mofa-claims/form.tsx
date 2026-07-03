import { useState, useRef, useEffect } from 'react'
import { normalizeImage } from '../../utils/normalizeImage'
import { downloadDocx } from './docx-builder'
import type { ReportData, SignOff, ClosingSignOff } from './report-types'

function formatCurrencyDisplay(raw: string): string {
  if (!raw) return ''
  const [intPart, decPart] = raw.split('.')
  const formattedInt = intPart ? new Intl.NumberFormat('en-LK').format(Number(intPart)) : '0'
  return decPart !== undefined ? formattedInt + '.' + decPart : formattedInt
}

function CurrencyInput({
  value,
  onChange,
}: {
  value?: string
  onChange: (raw: string) => void
}) {
  const [display, setDisplay] = useState('')
  useEffect(() => {
    if (value !== undefined) setDisplay(formatCurrencyDisplay(value))
  }, [value])
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '')
    if (raw && !/^\d*\.?\d{0,2}$/.test(raw)) return
    onChange(raw)
    setDisplay(formatCurrencyDisplay(raw))
  }
  return (
    <span className="currency-input-wrapper">
      <span className="currency-prefix">Rs.</span>
      <input type="text" value={display} onChange={handleChange} />
    </span>
  )
}

function SigImageUpload({
  imageSrc,
  onChange,
}: {
  imageSrc: string | null
  onChange: (src: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    normalizeImage(file).then((src) => onChange(src))
  }

  return (
    <div className="mc-sig-upload-area" onClick={() => !imageSrc && inputRef.current?.click()}>
      {imageSrc ? (
        <div className="sig-preview-wrapper">
          <img src={imageSrc} alt="Signature" className="mc-sig-image" />
          <button
            className="remove-btn no-print"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
          >
            &times;
          </button>
        </div>
      ) : (
        <div className="mc-sig-placeholder no-print">Sign here</div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}

function PeopleTable({
  rows,
  onChange,
}: {
  rows: SignOff[]
  onChange: (i: number, row: SignOff) => void
}) {
  return (
    <table className="mc-people-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Designation</th>
          <th>Signature</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            <td>
              <input
                type="text"
                className="mc-name-input"
                value={row.name}
                onChange={(e) => onChange(i, { ...row, name: e.target.value })}
                placeholder="Name"
              />
            </td>
            <td>
              <input
                type="text"
                className="mc-title-input"
                value={row.title}
                onChange={(e) => onChange(i, { ...row, title: e.target.value })}
                placeholder="Designation"
              />
            </td>
            <td className="mc-sig-cell">
              <SigImageUpload
                imageSrc={row.imageSrc}
                onChange={(src) => onChange(i, { ...row, imageSrc: src })}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function MofaClaimsForm() {
  const [refNo, setRefNo] = useState('')
  const [date, setDate] = useState('')

  const [to, setTo] = useState<SignOff[]>([
    { name: 'Sithumina Jayasundara', title: 'Chief Executive Officer', imageSrc: null },
    { name: 'Dilshan Perera', title: 'Chief Operating Officer', imageSrc: null },
    { name: 'Roshan Kularathne', title: 'Chief Financial Officer', imageSrc: null },
    { name: 'Lasantha De Alwis', title: 'Chief Technical Officer', imageSrc: null },
  ])
  const [through, setThrough] = useState<SignOff>({
    name: 'Krishan Wickramasinghe',
    title: 'Senior Manager – Motor & Medical Claims',
    imageSrc: null,
  })
  const [from, setFrom] = useState<SignOff>({
    name: 'Suraj Punchihewa',
    title: 'Manager – Motor Claims',
    imageSrc: null,
  })

  const [vehicleNo, setVehicleNo] = useState('')
  const [claimNo, setClaimNo] = useState('')
  const [dateOfAccident, setDateOfAccident] = useState('')
  const [coverFrom, setCoverFrom] = useState('')
  const [coverTo, setCoverTo] = useState('')
  const [sumInsured, setSumInsured] = useState('')
  const [valuationAmount, setValuationAmount] = useState('')
  const [payableAmount, setPayableAmount] = useState('')

  const [closing, setClosing] = useState<ClosingSignOff>({
    imageSrc: null,
    name: '',
    designation: '',
  })

  const buildReportData = (): ReportData => ({
    refNo,
    date,
    to,
    through,
    from,
    vehicleNo,
    claimNo,
    dateOfAccident,
    coverFrom,
    coverTo,
    sumInsured,
    valuationAmount,
    payableAmount,
    closing,
  })

  const filename = vehicleNo ? `${vehicleNo}.docx` : 'mofa-claims.docx'

  const handlePrintPDF = () => {
    const prev = document.title
    document.title = vehicleNo || 'mofa-claims'
    window.print()
    document.title = prev
  }

  const handleDownloadDocx = () => downloadDocx(buildReportData(), filename)

  return (
    <>
      <div className="mc-ref-line">
        <span>TL/MOFA/</span>
        <input
          type="text"
          className="mc-ref-input"
          value={refNo}
          onChange={(e) => setRefNo(e.target.value)}
          placeholder="___"
        />
      </div>

      <h1 className="mc-title">
        M - O - F - A
        <span className="mc-title-sub">MEMORANDUM</span>
      </h1>

      <div className="section-break mc-people-section">
        <div className="mc-people-label">To :</div>
        <PeopleTable rows={to} onChange={(i, row) => setTo((prev) => prev.map((r, idx) => (idx === i ? row : r)))} />
      </div>

      <div className="section-break mc-people-section">
        <div className="mc-people-label">Through :</div>
        <PeopleTable rows={[through]} onChange={(_, row) => setThrough(row)} />
      </div>

      <div className="section-break mc-people-section">
        <div className="mc-people-label">From :</div>
        <PeopleTable rows={[from]} onChange={(_, row) => setFrom(row)} />
      </div>

      <div className="mc-date-line">
        <span>Date :</span>
        <input type="date" className="mc-date-input" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <h2 className="mc-subject">
        SUBJECT : MOFA APPROVAL FOR TOTAL LOSS SETTLEMENT
      </h2>

      <p className="mc-intro">
        As per the investigation carried out by us revealed that this is a genuine claim and no any policy
        condition violation.
      </p>

      <div className="section-break">
        <table className="mc-details-table">
          <tbody>
            <tr>
              <th>Vehicle No.</th>
              <td>
                <input type="text" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} />
              </td>
            </tr>
            <tr>
              <th>Claim No</th>
              <td>
                <input type="text" value={claimNo} onChange={(e) => setClaimNo(e.target.value)} />
              </td>
            </tr>
            <tr>
              <th>Date of Accident</th>
              <td>
                <input
                  type="date"
                  value={dateOfAccident}
                  onChange={(e) => setDateOfAccident(e.target.value)}
                />
              </td>
            </tr>
            <tr>
              <th>Period of Cover</th>
              <td className="mc-period-cell">
                <input type="date" value={coverFrom} onChange={(e) => setCoverFrom(e.target.value)} />
                <span>to</span>
                <input type="date" value={coverTo} onChange={(e) => setCoverTo(e.target.value)} />
              </td>
            </tr>
            <tr>
              <th>Sum Insured</th>
              <td>
                <CurrencyInput value={sumInsured} onChange={setSumInsured} />
              </td>
            </tr>
            <tr>
              <th>Valuation Amount</th>
              <td>
                <CurrencyInput value={valuationAmount} onChange={setValuationAmount} />
              </td>
            </tr>
            <tr>
              <th>Payable Amount</th>
              <td>
                <CurrencyInput value={payableAmount} onChange={setPayableAmount} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mc-approval-request">Kindly grant your approval.</p>

      <div className="section-break mc-closing">
        <SigImageUpload
          imageSrc={closing.imageSrc}
          onChange={(src) => setClosing((prev) => ({ ...prev, imageSrc: src }))}
        />
        <input
          type="text"
          className="mc-closing-name"
          value={closing.name}
          onChange={(e) => setClosing((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Name"
        />
        <input
          type="text"
          className="mc-closing-designation"
          value={closing.designation}
          onChange={(e) => setClosing((prev) => ({ ...prev, designation: e.target.value }))}
          placeholder="Designation"
        />
      </div>

      <div className="no-print action-buttons">
        <button className="print-pdf-btn" onClick={handlePrintPDF}>
          Print to PDF
        </button>
        <button className="print-pdf-btn" onClick={handleDownloadDocx}>
          Download DOCX
        </button>
      </div>
    </>
  )
}
