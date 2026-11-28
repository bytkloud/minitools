import { useState, useRef } from 'react'
import { downloadDocx } from './docx-builder'
import { normalizeImage } from '../../utils/normalizeImage'
import type { DamageData, ReportData, SignatureData, TyreKey } from './report-types'
import { trackDownload } from '../../utils/track'

const TYRES = [
  { key: 'FrontRhs'  as const, label: 'Front RHS' },
  { key: 'FrontLhs'  as const, label: 'Front LHS' },
  { key: 'RearRhsIn' as const, label: 'Rear RHS – In' },
  { key: 'RearRhsOut'as const, label: 'Rear RHS – Out' },
  { key: 'RearLhsIn' as const, label: 'Rear LHS – In' },
  { key: 'RearLhsOut'as const, label: 'Rear LHS – Out' },
]

function formatRupees(raw: string) {
  return raw
    ? 'Rupees ' + new Intl.NumberFormat('en-LK', { minimumFractionDigits: 2 }).format(Number(raw))
    : 'Rupees ___________'
}

function buildFinalBody(rawAmount: string) {
  return `Therefore, considering all technical circumstances, my technical opinion is to treat this claim on a total loss basis by offering ${formatRupees(rawAmount)}.`
}

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
  return `The repair cost would be in the region of ${formatRupees(rawAmount)}. Considering the sum insured, pre-accident value, repair cost, and salvage value, no repair process can be approved.`
}

const SIGNATURES = [
  { key: 'juniorEngineer' as const, label: 'Junior Motor Engineer' },
  { key: 'zonalEngineer'  as const, label: 'Zonal Motor Engineer' },
  { key: 'chiefEngineer'  as const, label: 'Chief Motor Engineer' },
]

const VALUATIONS = [
  { key: 'careDriveValue'  as const, label: "'CareDrive' Valuation" },
  { key: 'godwinYapaValue' as const, label: "'Godwin Yapa' Valuation" },
  { key: 'deSilvaValue'    as const, label: "'De Silva' Valuation" },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function CurrencyInput({ value, onChange }: { value: string; onChange: (raw: string) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '')
    if (raw && isNaN(Number(raw))) return
    onChange(raw)
  }

  return (
    <span className="currency-input-wrapper">
      <span className="currency-prefix">LKR</span>
      <input type="text" value={value ? new Intl.NumberFormat('en-LK').format(Number(value)) : ''} onChange={handleChange} />
    </span>
  )
}

function TyrePhotoUpload({ src, onChange }: { src: string | null; onChange: (src: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div
      className={`quadrant-cell tyre-photo-cell${!src ? ' no-print' : ''}`}
      onClick={() => !src && inputRef.current?.click()}
    >
      {src ? (
        <>
          <img src={src} alt="Tyre" />
          <button
            className="remove-btn no-print"
            onClick={(e) => { e.stopPropagation(); onChange(null) }}
          >&times;</button>
        </>
      ) : (
        <span className="placeholder">+ Photo</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) normalizeImage(file).then(onChange)
          e.target.value = ''
        }}
      />
    </div>
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
        <span>Name:&nbsp;</span>
        <input
          type="text"
          className="sig-name-input"
          placeholder="Name"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
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

// ─── Main form ────────────────────────────────────────────────────────────────

type TextFields = {
  registrationNo: string; claimNo: string; makeModel: string; chassisNo: string
  importedStatus: string; yom: string; policyNo: string; policyHolder: string
}

const IMPORTED_STATUSES = ['Brand New', 'New', 'Recondition']

type CurrencyFields = {
  sumInsured: string; pav: string
  careDriveValue: string; godwinYapaValue: string; deSilvaValue: string
  salvageValue: string
}

type TyreFields = ReportData['tyres']

const EMPTY_TYRE_PHOTOS: Record<TyreKey, string | null> = {
  FrontRhs: null, FrontLhs: null, RearRhsIn: null, RearRhsOut: null, RearLhsIn: null, RearLhsOut: null,
}

export default function OrientTotalLossForm() {
  const [fields, setFields] = useState<TextFields>({
    registrationNo: '', claimNo: '', makeModel: '', chassisNo: '',
    importedStatus: '', yom: '', policyNo: '', policyHolder: '',
  })
  const [currency, setCurrency] = useState<CurrencyFields>({
    sumInsured: '', pav: '',
    careDriveValue: '', godwinYapaValue: '', deSilvaValue: '',
    salvageValue: '',
  })
  const [averageOverride, setAverageOverride] = useState<string | null>(null)
  const [tyrePhotos, setTyrePhotos] = useState(EMPTY_TYRE_PHOTOS)
  const [offerAmount, setOfferAmount] = useState('')
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
    juniorEngineer: { imageSrc: null, name: '', date: '' },
    zonalEngineer:  { imageSrc: null, name: '', date: '' },
    chiefEngineer:  { imageSrc: null, name: '', date: '' },
  })
  const nextDamageId = useRef(1)

  const setField = (key: keyof TextFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFields(prev => ({ ...prev, [key]: e.target.value }))

  const setCurrencyField = (key: keyof CurrencyFields) => (raw: string) =>
    setCurrency(prev => ({ ...prev, [key]: raw }))

  const setValuation = (key: keyof CurrencyFields) => (raw: string) => {
    setCurrencyField(key)(raw)
    setAverageOverride(null)
  }

  const filledValuations = VALUATIONS.map(v => currency[v.key]).filter(v => v !== '' && !isNaN(Number(v)))
  const computedAverage = filledValuations.length
    ? String(Math.round(filledValuations.reduce((a, v) => a + Number(v), 0) / filledValuations.length * 100) / 100)
    : ''
  const marketAverage = averageOverride ?? computedAverage

  const roundDownAverage = () => {
    if (marketAverage) setAverageOverride(String(Math.floor(Number(marketAverage) / 1000) * 1000))
  }

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
    marketAverage,
    damages,
    tyres,
    tyrePhotos,
    finalConclusion: buildFinalBody(offerAmount),
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

  const handleDownloadDocx = () => { trackDownload('docx'); return downloadDocx(buildReportData()) }

  return (
    <>
      <h1>Total loss report</h1>

      <div className="section-break">
        <h2>Vehicle Details</h2>
        <table>
          <tbody>
            {([
              ['Registration Number', 'registrationNo'],
              ['Claim Number',        'claimNo'],
              ['Make / Model',        'makeModel'],
              ['Chassis Number',      'chassisNo'],
              ['Imported Status',     'importedStatus'],
              ['Y.O.M',               'yom'],
              ['Policy No',           'policyNo'],
              ['Policy Holder',       'policyHolder'],
            ] as [string, keyof TextFields][]).map(([label, key]) => (
              <tr key={key}>
                <th>{label}</th>
                <td>
                  {key === 'importedStatus' ? (
                    <select value={fields[key]} onChange={setField(key)}>
                      <option value="">— Select —</option>
                      {IMPORTED_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={fields[key]} onChange={setField(key)} />
                  )}
                </td>
              </tr>
            ))}
            {([
              ['Sum Insured', 'sumInsured'],
              ['PAV',         'pav'],
            ] as [string, keyof CurrencyFields][]).map(([label, key]) => (
              <tr key={key}>
                <th>{label}</th>
                <td><CurrencyInput value={currency[key]} onChange={setCurrencyField(key)} /></td>
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
            {VALUATIONS.map(({ key, label }, i) => (
              <tr key={key}>
                <td>{i + 1}. {label}</td>
                <td><CurrencyInput value={currency[key]} onChange={setValuation(key)} /></td>
              </tr>
            ))}
            <tr>
              <th>Market Average</th>
              <td>
                <div className="market-average-cell">
                  <CurrencyInput value={marketAverage} onChange={setAverageOverride} />
                  <button type="button" className="avg-btn no-print" onClick={roundDownAverage} disabled={!marketAverage} title="Round down to nearest 1,000">
                    Round ↓ 1000
                  </button>
                  {averageOverride !== null && (
                    <button type="button" className="avg-btn no-print" onClick={() => setAverageOverride(null)} title="Reset to calculated average">
                      Reset
                    </button>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="section-break">
        <h2>Technical Salvage</h2>
        <table>
          <tbody>
            <tr><th style={{ width: '40%' }}>Salvage Value</th><td><CurrencyInput value={currency.salvageValue} onChange={setCurrencyField('salvageValue')} /></td></tr>
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
            <tr><th>Position</th><th>Condition</th><th>Photo</th></tr>
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
                <td>
                  <TyrePhotoUpload
                    src={tyrePhotos[key]}
                    onChange={(src) => setTyrePhotos(prev => ({ ...prev, [key]: src }))}
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
                      <CurrencyInput value={sumRepairCost} onChange={setSumRepairCost} />
                    </div>
                  )}
                  <div className="conclusion-option-body">{body}</div>
                </div>
              </div>
            </div>
          )
        })}
        <div className="conclusion-item">
          <div className="conclusion-option no-print active conclusion-fixed">
            <input type="checkbox" checked disabled />
            <div className="conclusion-option-content">
              <div className="conclusion-option-title">{CONCLUSIONS.length + 1}. Total Loss Offer</div>
              <div className="conclusion-sum-input">
                <span className="conclusion-sum-label">Offer amount</span>
                <CurrencyInput value={offerAmount} onChange={setOfferAmount} />
              </div>
              <div className="conclusion-option-body">{buildFinalBody(offerAmount)}</div>
            </div>
          </div>
        </div>
        <div className="conclusion-custom no-print">
          <textarea
            placeholder="Additional notes (optional)…"
            rows={3}
            value={customConclusion}
            onChange={e => setCustomConclusion(e.target.value)}
          />
        </div>
        <div className="print-only">
          {(activeConclusions.some(Boolean) || customConclusion.trim()) && (
            <ul className="conclusion-bullets">
              {CONCLUSIONS.map((c, i) => {
                if (!activeConclusions[i]) return null
                const body = i === SUM_IDX ? buildSumBody(sumRepairCost) : c.body
                return <li key={i}>{body}</li>
              })}
              {customConclusion.trim() && <li>{customConclusion.trim()}</li>}
            </ul>
          )}
          <p className="conclusion-therefore">{buildFinalBody(offerAmount)}</p>
        </div>
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
        <button className="print-pdf-btn" onClick={() => { trackDownload('pdf'); window.print() }}>Print to PDF</button>
        <button className="print-pdf-btn" onClick={handleDownloadDocx}>Download DOCX</button>
      </div>
    </>
  )
}
