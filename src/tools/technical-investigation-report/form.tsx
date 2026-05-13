import { useState, useRef } from 'react'


const TYRES = [
  { key: 'FrontRhs', label: 'Front RHS' },
  { key: 'FrontLhs', label: 'Front LHS' },
  { key: 'RearRhsIn', label: 'Rear RHS – In' },
  { key: 'RearRhsOut', label: 'Rear RHS – Out' },
  { key: 'RearLhsIn', label: 'Rear LHS – In' },
  { key: 'RearLhsOut', label: 'Rear LHS – Out' },
]

const SIGNATURES = [
  { key: 'areaEngineer', label: 'Area Engineer' },
  { key: 'zonalEngineer', label: 'Zonal Engineer' },
  { key: 'managerMotor', label: 'Manager Motor Engineer' },
]


const formatCurrencyDisplay = (val: string) => {
  if (!val) return ''
  const num = Number(val.replace(/,/g, ''))
  if (isNaN(num)) return val
  return new Intl.NumberFormat('en-LK').format(num)
}

const parseCurrencyInput = (val: string) => {
  return val.replace(/,/g, '')
}


function QuadrantPhotoUpload({ fieldKey }: { fieldKey: string }) {
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null])

  const handleFile = (idx: number, file: File) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhotos(prev => {
        const next = [...prev]
        next[idx] = ev.target?.result as string
        return next
      })
    }
    reader.readAsDataURL(file)
  }

  const handleRemove = (idx: number) => {
    setPhotos(prev => {
      const next = [...prev]
      next[idx] = null
      return next
    })
  }

  return (
    <div className="quadrant-grid">
      {photos.map((src, idx) => (
        <div
          key={idx}
          className={`quadrant-cell${!src ? ' no-print' : ''}`}
          onClick={() => !src && inputRefs.current[idx]?.click()}
        >
          {src ? (
            <>
              <img src={src} alt={`Photo ${idx + 1}`} />
              <button
                className="remove-btn no-print"
                onClick={(e) => { e.stopPropagation(); handleRemove(idx) }}
              >&times;</button>
            </>
          ) : (
            <span className="placeholder">+ Photo {idx + 1}</span>
          )}
          <input
            ref={el => { inputRefs.current[idx] = el }}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(idx, file)
              e.target.value = ''
            }}
          />
        </div>
      ))}
    </div>
  )
}

function SignatureUpload({ sigKey, label }: { sigKey: string; label: string }) {
  const [src, setSrc] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (ev) => setSrc(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="signature-box">
      <div className="sig-label">{label}</div>
      <div className="sig-upload-area" onClick={() => !src && inputRef.current?.click()}>
        {src ? (
          <div className="sig-preview-wrapper">
            <img src={src} alt="Signature" className="sig-image" />
            <button className="remove-btn no-print" onClick={(e) => { e.stopPropagation(); setSrc(null) }}>&times;</button>
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
        <span>Date:&nbsp;</span>
        <input type="date" className="sig-date-input" />
      </div>
    </div>
  )
}

function CurrencyInput({ field }: { field: string }) {
  const [raw, setRaw] = useState('')
  const [display, setDisplay] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseCurrencyInput(e.target.value)
    if (parsed && isNaN(Number(parsed))) return
    setRaw(parsed)
    setDisplay(formatCurrencyDisplay(parsed))
  }

  return (
    <span className="currency-input-wrapper">
      <span className="currency-prefix">LKR</span>
      <input
        type="text"
        data-field={field}
        value={display}
        onChange={handleChange}
      />
    </span>
  )
}

export default function TechnicalInvestigationReportForm() {
  const [conclusion, setConclusion] = useState('')
  const [damageRows, setDamageRows] = useState<number[]>([0])
  const [damageText, setDamageText] = useState<Record<number, string>>({})
  const nextDamageId = useRef(1)

  const addDamageRow = () => {
    setDamageRows(prev => [...prev, nextDamageId.current++])
  }

  return (
    <>
      <h1>Total loss report</h1>

      <div className="section-break">
        <h2>Vehicle Details</h2>
        <table>
          <tbody>
            {([
              ['Vehicle No', 'vehicleNo', false],
              ['MOI No', 'moiNo', false],
              ['Chassis No', 'chassisNo', false],
              ['Make / Model', 'makeModel', false],
              ['Y.O.M', 'yom', false],
              ['Mileage', 'mileage', false],
              ['Sum Insured', 'sumInsured', true],
              ['PAV', 'pav', true],
            ] as const).map(([label, field, isCurrency]) => (
              <tr key={field}>
                <th>{label}</th>
                <td>{isCurrency ? <CurrencyInput field={field} /> : <input type="text" data-field={field} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-break">
        <h2>Market Value Confirmation</h2>
        <table>
          <thead>
            <tr><th>Description</th><th>Value</th></tr>
          </thead>
          <tbody>
            {([
              ['Current Market Values – In Web', 'marketWebValue'],
              ['Confirmation by Valuation Officer (Channaka)', 'valuationOfficerValue'],
              ['Confirmation by Area Engineer (Physical Inspection)', 'areaEngineerValue'],
              ['Confirmation by Zonal Engineer', 'zonalEngineerValue'],
            ] as const).map(([label, field]) => (
              <tr key={field}>
                <td>{label}</td>
                <td><CurrencyInput field={field} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-break">
        <h2>Technical Salvage</h2>
        <table>
          <tbody>
            <tr><th style={{ width: '40%' }}>Salvage Value</th><td><CurrencyInput field="salvageValue" /></td></tr>
            <tr><th>Wreck Value</th><td><CurrencyInput field="wreckValue" /></td></tr>
          </tbody>
        </table>
      </div>

      <div className="section-break">
        <h2>Damages</h2>
        {damageRows.map((id, i) => (
          <div className="damage-block" key={id}>
            <div className="damage-desc">
              <span className="damage-num">{i + 1}.</span>
              <textarea
                className="no-print"
                data-field={`damage_${id}`}
                placeholder="Description of damage"
                rows={2}
                value={damageText[id] ?? ''}
                onChange={(e) => setDamageText(prev => ({ ...prev, [id]: e.target.value }))}
              />
              <div className="damage-desc-print print-only">{damageText[id]}</div>
            </div>
            <QuadrantPhotoUpload fieldKey={`damage_${id}`} />
          </div>
        ))}
        <button className="add-row-btn no-print" onClick={addDamageRow}>+ Add Row</button>
      </div>

      <div className="section-break">
        <h2>Tyre Report</h2>
        <table className="tyre-table">
          <thead>
            <tr>
              <th>Position</th>
              <th>Condition</th>
            </tr>
          </thead>
          <tbody>
            {TYRES.map(({ key, label }) => (
              <tr key={key}>
                <td>{label}</td>
                <td><input type="text" data-field={`tyre${key}Cond`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-break">
        <h2>Conclusion</h2>
        <textarea
          className="conclusion-textarea"
          rows={6}
          value={conclusion}
          onChange={(e) => setConclusion(e.target.value)}
        />
      </div>

      <div className="section-break">
        <h2>Signatures</h2>
        <div className="signature-section">
          {SIGNATURES.map(({ key, label }) => (
            <SignatureUpload key={key} sigKey={key} label={label} />
          ))}
        </div>
      </div>

      <button className="print-pdf-btn no-print" onClick={() => window.print()}>Print to PDF</button>
    </>
  )
}
