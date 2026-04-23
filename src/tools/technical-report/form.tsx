import { useState, useRef } from 'react'

const DAMAGES = [
  { key: 'damageHood', label: '1. Hood' },
  { key: 'damageRhsBody', label: '2. RHS Body' },
  { key: 'damageLhsBody', label: '3. LHS Body' },
  { key: 'damageFacePanel', label: '4. Face Panel' },
  { key: 'damageRearDoor', label: '5. Rear Door' },
]

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

const CURRENCY_FIELDS = new Set([
  'sumInsured', 'pav',
  'marketWebValue', 'valuationOfficerValue', 'areaEngineerValue', 'zonalEngineerValue',
  'salvageValue', 'wreckValue',
])

const formatCurrencyDisplay = (val: string) => {
  if (!val) return ''
  const num = Number(val.replace(/,/g, ''))
  if (isNaN(num)) return val
  return new Intl.NumberFormat('en-LK').format(num)
}

const parseCurrencyInput = (val: string) => {
  return val.replace(/,/g, '')
}

interface PhotoSlot {
  id: number
  src: string | null
}

function PhotoUploadArea({ fieldKey }: { fieldKey: string }) {
  const [slots, setSlots] = useState<PhotoSlot[]>([{ id: 0, src: null }])
  const nextId = useRef(1)
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const handleFileChange = (slotId: number, file: File) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      setSlots(prev => {
        const updated = prev.map(s => s.id === slotId ? { ...s, src } : s)
        const newId = nextId.current++
        return [...updated, { id: newId, src: null }]
      })
    }
    reader.readAsDataURL(file)
  }

  const handleRemove = (slotId: number) => {
    setSlots(prev => prev.filter(s => s.id !== slotId))
  }

  const handleClick = (slotId: number) => {
    inputRefs.current[slotId]?.click()
  }

  return (
    <div className="photo-upload-area">
      {slots.map((slot, idx) => (
        <div key={slot.id} className={`photo-slot${!slot.src ? ' no-print' : ''}`}>
          <label>Photo {idx + 1}</label>
          <div className="photo-preview" onClick={() => !slot.src && handleClick(slot.id)}>
            {slot.src ? (
              <>
                <img src={slot.src} alt="" />
                <button className="remove-btn no-print" onClick={(e) => { e.stopPropagation(); handleRemove(slot.id) }}>&times;</button>
              </>
            ) : (
              <span className="placeholder">+</span>
            )}
          </div>
          <input
            ref={el => { inputRefs.current[slot.id] = el }}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileChange(slot.id, file)
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

export default function TechnicalReportForm() {
  const [conclusion, setConclusion] = useState('')

  return (
    <>
      <h1>Technical Report</h1>

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
        <table>
          <thead>
            <tr><th>Part</th><th>Description of Damage</th><th>Photos</th></tr>
          </thead>
          <tbody>
            {DAMAGES.map(({ key, label }) => (
              <tr className="damage-row" key={key}>
                <td>{label}</td>
                <td><input type="text" data-field={key} /></td>
                <td className="photo-cell"><PhotoUploadArea fieldKey={key} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-break">
        <h2>Tyre Report</h2>
        <table className="tyre-table">
          <thead>
            <tr>
              <th>Position</th>
              <th>Condition</th>
              <th>Photos</th>
            </tr>
          </thead>
          <tbody>
            {TYRES.map(({ key, label }) => (
              <tr key={key}>
                <td>{label}</td>
                <td><input type="text" data-field={`tyre${key}Cond`} /></td>
                <td><PhotoUploadArea fieldKey={`tyre${key}`} /></td>
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
