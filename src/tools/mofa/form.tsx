import { useState, useRef, useEffect } from 'react'
import { normalizeImage } from '../../utils/normalizeImage'
import { downloadDocx } from './docx-builder'
import type { ReportData, SignatureData } from './report-types'
import { SIGNATURE_NAMES, type SignatureKey } from '../../data/signatureNames'

type Signatures = {
  areaEngineer: SignatureData
  zonalEngineer: SignatureData
  managerMotor: SignatureData
}

const ALL_SIGS: { key: keyof Signatures; label: string }[] = [
  { key: 'areaEngineer', label: 'Area Engineer' },
  { key: 'zonalEngineer', label: 'Zonal Engineer' },
  { key: 'managerMotor', label: 'Manager Motor Engineer' },
]

type SettlementBasis =
  | 'Estimate Basis'
  | 'Full and final Offer'
  | 'Cash in lieu'
  | 'Wreck to the Insure Basis'

const SETTLEMENT_OPTIONS: SettlementBasis[] = [
  'Estimate Basis',
  'Full and final Offer',
  'Cash in lieu',
  'Wreck to the Insure Basis',
]

const TYRES = [
  { key: 'FrontRhs'  as const, label: 'Front RHS' },
  { key: 'FrontLhs'  as const, label: 'Front LHS' },
  { key: 'RearRhsIn' as const, label: 'Rear RHS – In' },
  { key: 'RearRhsOut'as const, label: 'Rear RHS – Out' },
  { key: 'RearLhsIn' as const, label: 'Rear LHS – In' },
  { key: 'RearLhsOut'as const, label: 'Rear LHS – Out' },
]

function fmtLKR(n: number): string {
  return 'LKR ' + new Intl.NumberFormat('en-LK').format(n)
}

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
  // Sync display when the value is driven externally (controlled usage).
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
      <span className="currency-prefix">LKR</span>
      <input type="text" value={display} onChange={handleChange} />
    </span>
  )
}

// Suggests rounding the offer down to a cleaner figure to save money,
// and shows how the current offer compares to the ACR.
function OfferHint({
  acr,
  offerRaw,
  onPick,
}: {
  acr: number
  offerRaw: string
  onPick: (value: number) => void
}) {
  const offer = parseFloat(offerRaw) || 0
  if (offer <= 0) return null

  const diff = acr - offer // positive => offer is below ACR (a saving)
  const steps = [1000, 5000, 10000]
  const suggestions = steps
    .map((s) => Math.floor(offer / s) * s)
    .filter((v, i, arr) => v > 0 && v < offer && arr.indexOf(v) === i)

  let comparison: React.ReactNode
  if (diff > 0) {
    comparison = (
      <span className="mofa-offer-good">
        LKR {new Intl.NumberFormat('en-LK').format(diff)} below ACR
      </span>
    )
  } else if (diff === 0) {
    comparison = <span className="mofa-offer-warn">Offer equals the ACR</span>
  } else {
    comparison = (
      <span className="mofa-offer-warn">
        LKR {new Intl.NumberFormat('en-LK').format(-diff)} above ACR
      </span>
    )
  }

  return (
    <div className="mofa-offer-hint no-print">
      <div className="mofa-offer-hint-row">
        <span className="mofa-offer-hint-label">vs ACR:</span> {comparison}
      </div>
      {suggestions.length > 0 && (
        <div className="mofa-offer-hint-row">
          <span className="mofa-offer-hint-label">💡 Round down &amp; save:</span>
          {suggestions.map((v) => (
            <button
              key={v}
              type="button"
              className="mofa-offer-chip"
              onClick={() => onPick(v)}
              title={`Set offer to LKR ${new Intl.NumberFormat('en-LK').format(v)} (save LKR ${new Intl.NumberFormat('en-LK').format(offer - v)})`}
            >
              {new Intl.NumberFormat('en-LK').format(v)}
              <span className="mofa-offer-chip-save">
                −{new Intl.NumberFormat('en-LK').format(offer - v)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="mofa-toggle no-print">
      <div
        className="mofa-toggle-track"
        data-checked={String(checked)}
        onClick={() => onChange(!checked)}
      >
        <div className="mofa-toggle-thumb" />
      </div>
      <span className="mofa-toggle-label">{label}</span>
    </label>
  )
}

function YesNo({
  value,
  onChange,
  label,
}: {
  value: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <div className="mofa-yesno no-print">
      <span className="mofa-yesno-label">{label}</span>
      <div className="mofa-yesno-btns">
        <button
          type="button"
          className={value ? 'active' : ''}
          onClick={() => onChange(true)}
        >
          Yes
        </button>
        <button
          type="button"
          className={!value ? 'active' : ''}
          onClick={() => onChange(false)}
        >
          No
        </button>
      </div>
    </div>
  )
}

function SignatureUpload({
  label,
  nameKey,
  value,
  onChange,
}: {
  label: string
  nameKey: SignatureKey
  value: SignatureData
  onChange: (data: SignatureData) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    normalizeImage(file).then((src) => onChange({ ...value, imageSrc: src }))
  }

  return (
    <div className="signature-box">
      <div className="sig-label">{label}</div>
      <div className="sig-upload-area" onClick={() => !value.imageSrc && inputRef.current?.click()}>
        {value.imageSrc ? (
          <div className="sig-preview-wrapper">
            <img src={value.imageSrc} alt="Signature" className="sig-image" />
            <button
              className="remove-btn no-print"
              onClick={(e) => {
                e.stopPropagation()
                onChange({ ...value, imageSrc: null })
              }}
            >
              &times;
            </button>
          </div>
        ) : (
          <div className="sig-placeholder no-print">Click to upload signature</div>
        )}
      </div>
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
      <div className="sig-line">
        <span>Name:&nbsp;</span>
        <input
          type="text"
          className="sig-name-input"
          list={`sig-names-${nameKey}`}
          placeholder="Name"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
        <datalist id={`sig-names-${nameKey}`}>
          {SIGNATURE_NAMES[nameKey].map((n) => <option key={n} value={n} />)}
        </datalist>
      </div>
      <div className="sig-line sig-line-plain">
        <span>Date:&nbsp;</span>
        <input
          type="date"
          className="sig-date-input"
          value={value.date}
          onChange={(e) => onChange({ ...value, date: e.target.value })}
        />
      </div>
    </div>
  )
}

export default function MofaForm() {
  const [vehicleNo, setVehicleNo] = useState('')
  const [moi, setMoi] = useState('')
  const [model, setModel] = useState('')
  const [pav, setPav] = useState('')
  const [sum, setSum] = useState('')
  const [underInsurancePct, setUnderInsurancePct] = useState('')
  const [underInsuranceAmt, setUnderInsuranceAmt] = useState('')

  const [labor, setLabor] = useState('')
  const [parts, setParts] = useState('')
  const [payableAmount, setPayableAmount] = useState('')
  const [offerAmount, setOfferAmount] = useState('')
  const [policyExcess, setPolicyExcess] = useState('')

  const [settlementBasis, setSettlementBasis] = useState<SettlementBasis>('Estimate Basis')

  const [deductUnderInsurance, setDeductUnderInsurance] = useState(false)
  const [noFurtherPayments, setNoFurtherPayments] = useState(false)
  const [needCustomerConsent, setNeedCustomerConsent] = useState(false)
  const [needAri, setNeedAri] = useState(true)
  const [needSalvages, setNeedSalvages] = useState(true)
  const [subjectToPolicyCondition, setSubjectToPolicyCondition] = useState(false)
  const [needVatInvoice, setNeedVatInvoice] = useState(false)
  const [applyTyrePenalty, setApplyTyrePenalty] = useState(false)

  const [tyres, setTyres] = useState<ReportData['tyres']>({
    FrontRhs: '', FrontLhs: '', RearRhsIn: '', RearRhsOut: '', RearLhsIn: '', RearLhsOut: '',
  })

  const [notes, setNotes] = useState('')
  const [signatures, setSignatures] = useState<Signatures>({
    areaEngineer: { imageSrc: null, name: '', date: '' },
    zonalEngineer: { imageSrc: null, name: '', date: '' },
    managerMotor: { imageSrc: null, name: '', date: '' },
  })

  const laborNum = parseFloat(labor) || 0
  const partsNum = parseFloat(parts) || 0
  const acr = laborNum + partsNum

  const approvalLevel: 'none' | 'ze' | 'mme' =
    acr > 750000 ? 'mme' : acr >= 500000 ? 'ze' : 'none'

  const salutation =
    approvalLevel === 'ze' ? 'ZE' : approvalLevel === 'mme' ? 'MME' : null

  const visibleSigs =
    approvalLevel === 'none'
      ? ALL_SIGS.slice(0, 1)
      : approvalLevel === 'ze'
      ? ALL_SIGS.slice(0, 2)
      : ALL_SIGS

  const bannerText = {
    none: 'ACR below LKR 500,000 — No approval required',
    ze: 'ACR LKR 500,000–750,000 — Zonal Engineer approval required',
    mme: 'ACR above LKR 750,000 — Manager Motor Engineer approval required',
  }[approvalLevel]

  // Build numbered items for print (starting at 3, after the two tables)
  const printItems: string[] = []
  if (deductUnderInsurance)
    printItems.push('Payable amount mention after Deduct Under Insurance and Excess')
  if (noFurtherPayments) printItems.push('No further payments')
  if (needCustomerConsent) printItems.push('Need Customer Consent before settle the claim')
  printItems.push(needAri ? 'Need ARI' : 'No need ARI')
  printItems.push(needSalvages ? 'Need Salvages (REF ESTIMATE)' : 'No need salvages')
  if (subjectToPolicyCondition) printItems.push('Subject to policy condition')
  if (applyTyrePenalty) printItems.push('Need to apply tyre penalty')
  if (settlementBasis === 'Wreck to the Insure Basis')
    printItems.push('Need to cancel policy (only Wreck to the Insure Basis)')
  if (settlementBasis === 'Estimate Basis' && needVatInvoice) printItems.push('Need VAT Invoice')

  const buildReportData = (): ReportData => ({
    salutation,
    settlementBasis,
    vehicleNo, moi, model, pav, sum, underInsurancePct, underInsuranceAmt,
    labor, parts, acr,
    payableAmount, offerAmount, policyExcess,
    items: printItems,
    applyTyrePenalty,
    tyres,
    notes,
    signatures,
    visibleSigKeys: visibleSigs.map((s) => s.key),
  })

  const filename = vehicleNo ? `${vehicleNo}.docx` : 'mofa.docx'

  const handlePrintPDF = () => {
    const prev = document.title
    document.title = vehicleNo || 'mofa'
    window.print()
    document.title = prev
  }

  const handleDownloadDocx = () => downloadDocx(buildReportData(), filename)


  return (
    <>
      <div className={`mofa-approval-banner no-print approval-${approvalLevel}`}>
        {bannerText}
      </div>

      <h1>MOFA</h1>

      {salutation && <p className="mofa-dear">Dear {salutation},</p>}

      <p className="mofa-intro">
        Kindly need your approval to Process as{' '}
        <select
          className="mofa-basis-select no-print"
          value={settlementBasis}
          onChange={(e) => setSettlementBasis(e.target.value as SettlementBasis)}
        >
          {SETTLEMENT_OPTIONS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <strong className="mofa-basis-print print-only">{settlementBasis}</strong>
      </p>

      {/* 1) Vehicle Details */}
      <div className="section-break">
        <h2>1) Vehicle Details Below Mentioned</h2>
        <table>
          <tbody>
            <tr>
              <th>Vehicle No</th>
              <td>
                <input type="text" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} />
              </td>
            </tr>
            <tr>
              <th>MOI</th>
              <td>
                <input type="text" value={moi} onChange={(e) => setMoi(e.target.value)} />
              </td>
            </tr>
            <tr>
              <th>Model</th>
              <td>
                <input type="text" value={model} onChange={(e) => setModel(e.target.value)} />
              </td>
            </tr>
            <tr>
              <th>PAV</th>
              <td>
                <CurrencyInput onChange={setPav} />
              </td>
            </tr>
            <tr>
              <th>SUM</th>
              <td>
                <CurrencyInput onChange={setSum} />
              </td>
            </tr>
            <tr>
              <th>Under Insurance Penalty %</th>
              <td>
                <span className="pct-input-wrapper">
                  <input
                    type="text"
                    value={underInsurancePct}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9.]/g, '')
                      setUnderInsurancePct(v)
                    }}
                  />
                  <span className="pct-suffix">%</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 2) Offer Details */}
      <div className="section-break">
        <h2>2) Offer Details Below Mentioned</h2>
        <table>
          <tbody>
            <tr>
              <th>Labor</th>
              <td>
                <CurrencyInput onChange={setLabor} />
              </td>
            </tr>
            <tr>
              <th>Parts</th>
              <td>
                <CurrencyInput onChange={setParts} />
              </td>
            </tr>
            <tr>
              <th>ACR = Labor + Parts</th>
              <td className="mofa-acr-cell">
                {acr > 0 ? (
                  fmtLKR(acr)
                ) : (
                  <span className="no-print mofa-placeholder">calculated</span>
                )}
              </td>
            </tr>
            {settlementBasis !== 'Estimate Basis' && (
              <tr>
                <th>Offer Amount</th>
                <td>
                  <CurrencyInput value={offerAmount} onChange={setOfferAmount} />
                  <OfferHint acr={acr} offerRaw={offerAmount} onPick={(v) => setOfferAmount(String(v))} />
                </td>
              </tr>
            )}
            <tr>
              <th>Under Insurance Amount</th>
              <td>
                <CurrencyInput onChange={setUnderInsuranceAmt} />
              </td>
            </tr>
            <tr>
              <th>Policy Excess</th>
              <td>
                <CurrencyInput onChange={setPolicyExcess} />
              </td>
            </tr>
            {settlementBasis !== 'Estimate Basis' && (
              <tr>
                <th>Payable Amount</th>
                <td>
                  <CurrencyInput onChange={setPayableAmount} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Options — controls shown on screen, numbered list shown in print */}
      <div className="section-break mofa-conditions">
        <h2 className="no-print">Options</h2>

        <Toggle
          checked={deductUnderInsurance}
          onChange={setDeductUnderInsurance}
          label="Payable amount mention after Deduct Under Insurance and Excess"
        />
        <Toggle
          checked={noFurtherPayments}
          onChange={setNoFurtherPayments}
          label="No further payments"
        />
        <Toggle
          checked={needCustomerConsent}
          onChange={setNeedCustomerConsent}
          label="Need Customer Consent before settle the claim"
        />

        <YesNo value={needAri} onChange={setNeedAri} label="Need ARI?" />
        <YesNo value={needSalvages} onChange={setNeedSalvages} label="Need Salvages?" />

        <Toggle
          checked={subjectToPolicyCondition}
          onChange={setSubjectToPolicyCondition}
          label="Subject to policy condition"
        />
        <Toggle
          checked={applyTyrePenalty}
          onChange={setApplyTyrePenalty}
          label="Need to apply tyre penalty"
        />

        {settlementBasis === 'Wreck to the Insure Basis' && (
          <div className="mofa-info-pill no-print">
            Need to cancel policy will be included (Wreck to the Insure Basis)
          </div>
        )}

        {settlementBasis === 'Estimate Basis' && (
          <Toggle
            checked={needVatInvoice}
            onChange={setNeedVatInvoice}
            label="Need VAT Invoice"
          />
        )}

        {/* Print-only ordered list starting at 3 */}
        <ol className="mofa-items-list print-only" start={3}>
          {printItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      </div>

      {/* Tyre Report */}
      {applyTyrePenalty && (
        <div className="section-break">
          <h2>Tyre Report</h2>
          <table className="tyre-table">
            <thead>
              <tr><th>Position</th><th>Condition</th></tr>
            </thead>
            <tbody>
              {TYRES.map(({ key, label }) => (
                <tr key={key}>
                  <td>{label}</td>
                  <td>
                    <input
                      type="text"
                      value={tyres[key]}
                      onChange={(e) => setTyres((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes */}
      <div className="section-break">
        <h2 className="no-print">Further Notes</h2>
        <textarea
          className="report-textarea no-print"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter any further notes..."
        />
        {notes && <div className="mofa-notes-print print-only">{notes}</div>}
      </div>

      {/* Signatures */}
      <div className="section-break">
        <h2>Signatures</h2>
        <div className="signature-section">
          {visibleSigs.map(({ key, label }) => (
            <SignatureUpload
              key={key}
              label={label}
              nameKey={key}
              value={signatures[key]}
              onChange={(data) => setSignatures((prev) => ({ ...prev, [key]: data }))}
            />
          ))}
        </div>
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
