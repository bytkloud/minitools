import { useState, useRef } from 'react'
import { downloadDocx } from './docx-builder'
import { normalizeImage } from '../../utils/normalizeImage'
import type { DamageData, ReportData, SignatureData } from './report-types'

const TYRES = [
  { key: 'FrontRhs'  as const, label: 'Front RHS' },
  { key: 'FrontLhs'  as const, label: 'Front LHS' },
  { key: 'RearRhsIn' as const, label: 'Rear RHS – In' },
  { key: 'RearRhsOut'as const, label: 'Rear RHS – Out' },
  { key: 'RearLhsIn' as const, label: 'Rear LHS – In' },
  { key: 'RearLhsOut'as const, label: 'Rear LHS – Out' },
]

const THEREFORE = "Therefore, considering all technical circumstances, my technical opinion is to treat this claim on a total loss basis."

const CONCLUSIONS = [
  {
    title: 'Homogeneous Body Structure',
    body: "The homogeneous body structure has gone out of shape and specification due to direct and indirect impacts applied to the vehicle body. It is not advisable to carry out any professional collision repair techniques on the vehicle body. Even if repaired, it will fail to regain the manufacturer's original technical specifications and quality standards. It will also lose directional stability and static & dynamic equilibrium.",
  },
  {
    title: 'Chassis',
    body: "Several areas of the chassis have been bent. Therefore, based on R.M.V. regulations and professional collision repair techniques, we are not in a position to recommend any repair work on the chassis. Furthermore, if any repair work is carried out on the chassis, it may result in failure of directional stability.",
  },
  { title: 'Sum', body: '' }, // body built dynamically via buildSumBody
  {
    title: 'Fire',
    body: "The complete vehicle, along with all components, has gone out of shape, and the manufacturer's specifications have failed due to fire damage. Certain components of the vehicle have reached their melting point. The entire vehicle is not in a repairable condition based on professional collision repair standards.",
  },
  {
    title: 'Flood',
    body: "All electrical components and microprocessors are in a wet condition due to flooding. Any repair process cannot be recommended due to the risk of short circuits. Even if repairs are carried out, the vehicle will most probably fail to regain the manufacturer's original technical specifications and quality standards. In addition, the repair cost would not be economically viable.",
  },
]

const SUM_IDX = 2

function buildSumBody(rawAmount: string) {
  const formatted = rawAmount
    ? 'Rupees ' + new Intl.NumberFormat('en-LK', { minimumFractionDigits: 2 }).format(Number(rawAmount))
    : 'Rupees ___________'
  return `The repair cost would be in the region of ${formatted}. Considering the sum insured, pre-accident value, repair cost, and salvage value, no repair process can be approved.`
}

const SIGNATURES = [
  { key: 'areaEngineer' as const, label: 'Area Engineer' },
  { key: 'zonalEngineer'as const, label: 'Zonal Engineer' },
  { key: 'managerMotor' as const, label: 'Manager Motor Engineer' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function CurrencyInput({ onChange }: { onChange: (raw: string) => void }) {
  const [display, setDisplay] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '')
    if (raw && isNaN(Number(raw))) return
    onChange(raw)
    setDisplay(raw ? new Intl.NumberFormat('en-LK').format(Number(raw)) : '')
  }

  return (
    <span className="currency-input-wrapper">
      <span className="currency-prefix">LKR</span>
      <input type="text" value={display} onChange={handleChange} />
    </span>
  )
}

function QuadrantPhotoUpload({
  photos,
  onPhotoChange,
}: {
  photos: DamageData['photos']
  onPhotoChange: (idx: number, src: string | null) => void
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null])

  const handleFile = (idx: number, file: File) => {
    normalizeImage(file).then(src => onPhotoChange(idx, src))
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
                onClick={(e) => { e.stopPropagation(); onPhotoChange(idx, null) }}
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

function SignatureUpload({
  label,
  value,
  onChange,
}: {
  label: string
  value: SignatureData
  onChange: (data: SignatureData) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    normalizeImage(file).then(src => onChange({ ...value, imageSrc: src }))
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
              onClick={(e) => { e.stopPropagation(); onChange({ ...value, imageSrc: null }) }}
            >&times;</button>
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

// ─── Main form ────────────────────────────────────────────────────────────────

type TextFields = {
  vehicleNo: string; moiNo: string; chassisNo: string
  makeModel: string; yom: string; mileage: string
}

type CurrencyFields = {
  sumInsured: string; pav: string
  marketWebValue: string; valuationOfficerValue: string
  areaEngineerValue: string; zonalEngineerValue: string
  salvageValue: string; wreckValue: string
}

type TyreFields = ReportData['tyres']

export default function TotalLossReportForm() {
  const [fields, setFields] = useState<TextFields>({
    vehicleNo: '', moiNo: '', chassisNo: '', makeModel: '', yom: '', mileage: '',
  })
  const [currency, setCurrency] = useState<CurrencyFields>({
    sumInsured: '', pav: '',
    marketWebValue: '', valuationOfficerValue: '',
    areaEngineerValue: '', zonalEngineerValue: '',
    salvageValue: '', wreckValue: '',
  })
  const [tyres, setTyres] = useState<TyreFields>({
    FrontRhs: '', FrontLhs: '', RearRhsIn: '', RearRhsOut: '', RearLhsIn: '', RearLhsOut: '',
  })
  const [damages, setDamages] = useState<DamageData[]>([
    { id: 0, text: '', photos: [null, null, null, null] },
  ])
  const [activeConclusions, setActiveConclusions] = useState<boolean[]>(
    new Array(CONCLUSIONS.length).fill(false)
  )
  const [sumRepairCost, setSumRepairCost] = useState('')
  const [customConclusion, setCustomConclusion] = useState('')
  const [signatures, setSignatures] = useState<ReportData['signatures']>({
    areaEngineer: { imageSrc: null, date: '' },
    zonalEngineer: { imageSrc: null, date: '' },
    managerMotor:  { imageSrc: null, date: '' },
  })
  const nextDamageId = useRef(1)

  const setField = (key: keyof TextFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields(prev => ({ ...prev, [key]: e.target.value }))

  const setCurrencyField = (key: keyof CurrencyFields) => (raw: string) =>
    setCurrency(prev => ({ ...prev, [key]: raw }))

  const addDamageRow = () => {
    setDamages(prev => [...prev, { id: nextDamageId.current++, text: '', photos: [null, null, null, null] }])
  }

  const updateDamageText = (id: number, text: string) =>
    setDamages(prev => prev.map(d => d.id === id ? { ...d, text } : d))

  const updateDamagePhoto = (id: number, idx: number, src: string | null) =>
    setDamages(prev => prev.map(d => {
      if (d.id !== id) return d
      const photos = [...d.photos] as DamageData['photos']
      photos[idx] = src
      return { ...d, photos }
    }))

  const toggleConclusion = (idx: number) =>
    setActiveConclusions(prev => prev.map((v, i) => i === idx ? !v : v))

  const buildReportData = (): ReportData => ({
    ...fields,
    ...currency,
    damages,
    tyres,
    conclusions: [
      ...CONCLUSIONS
        .map((c, i) => {
          if (!activeConclusions[i]) return null
          return i === SUM_IDX ? buildSumBody(sumRepairCost) : c.body
        })
        .filter((c): c is string => c !== null),
      ...(customConclusion.trim() ? [customConclusion.trim()] : []),
    ],
    signatures,
  })

  const handleDownloadDocx = () => downloadDocx(buildReportData())

  return (
    <>
      <h1>Total loss report</h1>

      <div className="section-break">
        <h2>Vehicle Details</h2>
        <table>
          <tbody>
            {([
              ['Vehicle No',   'vehicleNo'],
              ['MOI No',       'moiNo'],
              ['Chassis No',   'chassisNo'],
              ['Make / Model', 'makeModel'],
              ['Y.O.M',        'yom'],
              ['Mileage',      'mileage'],
            ] as [string, keyof TextFields][]).map(([label, key]) => (
              <tr key={key}>
                <th>{label}</th>
                <td><input type="text" value={fields[key]} onChange={setField(key)} /></td>
              </tr>
            ))}
            {([
              ['Sum Insured', 'sumInsured'],
              ['PAV',         'pav'],
            ] as [string, keyof CurrencyFields][]).map(([label, key]) => (
              <tr key={key}>
                <th>{label}</th>
                <td><CurrencyInput onChange={setCurrencyField(key)} /></td>
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
              ['Current Market Values – In Web',                     'marketWebValue'],
              ['Confirmation by Valuation Officer (Channaka)',        'valuationOfficerValue'],
              ['Confirmation by Area Engineer (Physical Inspection)', 'areaEngineerValue'],
              ['Confirmation by Zonal Engineer',                     'zonalEngineerValue'],
            ] as [string, keyof CurrencyFields][]).map(([label, key]) => (
              <tr key={key}>
                <td>{label}</td>
                <td><CurrencyInput onChange={setCurrencyField(key)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-break">
        <h2>Technical Salvage</h2>
        <table>
          <tbody>
            <tr><th style={{ width: '40%' }}>Salvage Value</th><td><CurrencyInput onChange={setCurrencyField('salvageValue')} /></td></tr>
            <tr><th>Wreck Value</th><td><CurrencyInput onChange={setCurrencyField('wreckValue')} /></td></tr>
          </tbody>
        </table>
      </div>

      <div className="section-break">
        <h2>Damages</h2>
        {damages.map((dmg, i) => (
          <div className="damage-block" key={dmg.id}>
            <div className="damage-desc">
              <span className="damage-num">{i + 1}.</span>
              <textarea
                className="no-print"
                placeholder="Description of damage"
                rows={2}
                value={dmg.text}
                onChange={(e) => updateDamageText(dmg.id, e.target.value)}
              />
              <div className="damage-desc-print print-only">{dmg.text}</div>
            </div>
            <QuadrantPhotoUpload
              photos={dmg.photos}
              onPhotoChange={(idx, src) => updateDamagePhoto(dmg.id, idx, src)}
            />
          </div>
        ))}
        <button className="add-row-btn no-print" onClick={addDamageRow}>+ Add Row</button>
      </div>

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
                    onChange={(e) => setTyres(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-break">
        <h2>Conclusion</h2>
        {CONCLUSIONS.map((c, i) => {
          const body = i === SUM_IDX ? buildSumBody(sumRepairCost) : c.body
          return (
            <div key={i} className="conclusion-item">
              <div className={`conclusion-option no-print${activeConclusions[i] ? ' active' : ''}`}>
                <input
                  type="checkbox"
                  checked={activeConclusions[i]}
                  onChange={() => toggleConclusion(i)}
                />
                <div className="conclusion-option-content">
                  <div className="conclusion-option-title" onClick={() => toggleConclusion(i)}>
                    {i + 1}. {c.title}
                  </div>
                  {i === SUM_IDX && (
                    <div className="conclusion-sum-input" onClick={e => e.stopPropagation()}>
                      <span className="conclusion-sum-label">Repair cost</span>
                      <CurrencyInput onChange={setSumRepairCost} />
                    </div>
                  )}
                  <div className="conclusion-option-body">{body}</div>
                </div>
              </div>
            </div>
          )
        })}
        <div className="conclusion-custom no-print">
          <textarea
            placeholder="Additional notes (optional)…"
            rows={3}
            value={customConclusion}
            onChange={e => setCustomConclusion(e.target.value)}
          />
        </div>
        {(activeConclusions.some(Boolean) || customConclusion.trim()) && (
          <div className="print-only">
            <ul className="conclusion-bullets">
              {CONCLUSIONS.map((c, i) => {
                if (!activeConclusions[i]) return null
                const body = i === SUM_IDX ? buildSumBody(sumRepairCost) : c.body
                return <li key={i}>{body}</li>
              })}
              {customConclusion.trim() && <li>{customConclusion.trim()}</li>}
            </ul>
            <p className="conclusion-therefore">{THEREFORE}</p>
          </div>
        )}
      </div>

      <div className="section-break">
        <h2>Signatures</h2>
        <div className="signature-section">
          {SIGNATURES.map(({ key, label }) => (
            <SignatureUpload
              key={key}
              label={label}
              value={signatures[key]}
              onChange={(data) => setSignatures(prev => ({ ...prev, [key]: data }))}
            />
          ))}
        </div>
      </div>

      <div className="no-print action-buttons">
        <button className="print-pdf-btn" onClick={() => window.print()}>Print to PDF</button>
        <button className="print-pdf-btn" onClick={handleDownloadDocx}>Download DOCX</button>
      </div>
    </>
  )
}
