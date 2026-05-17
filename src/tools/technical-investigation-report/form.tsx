import { useState, useRef } from 'react'
import { downloadDocx } from './docx-builder'
import { normalizeImage } from '../../utils/normalizeImage'
import type { ReportData, SignatureData } from './report-types'

const SIGNATURES = [
  { key: 'areaEngineer' as const, label: 'Area Engineer' },
  { key: 'zonalEngineer' as const, label: 'Zonal Engineer' },
  { key: 'managerMotor' as const, label: 'Manager Motor Engineer' },
]

const VEHICLE_FIELDS = [
  { field: 'vehicleNo' as const, label: 'Vehicle No' },
  { field: 'moiNo' as const, label: 'MOI No' },
  { field: 'makeModel' as const, label: 'Make / Model' },
  { field: 'acr' as const, label: 'ACR' },
]

function ObservationImageSlot({ idx, onChange, onRemove, src }: {
  idx: number
  src: string | null
  onChange: (idx: number, file: File) => void
  onRemove: (idx: number) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="obs-img-slot" onClick={() => !src && inputRef.current?.click()}>
      {src ? (
        <>
          <img src={src} alt={`Photo ${idx + 1}`} />
          <button className="remove-btn no-print" onClick={(e) => { e.stopPropagation(); onRemove(idx) }}>&times;</button>
        </>
      ) : (
        <span className="placeholder">+ Photo {idx + 1}</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onChange(idx, file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

function SignatureUpload({ label, value, onChange }: {
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
            <button className="remove-btn no-print" onClick={(e) => { e.stopPropagation(); onChange({ ...value, imageSrc: null }) }}>&times;</button>
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

export default function TechnicalInvestigationReportForm() {
  const [vehicleFields, setVehicleFields] = useState({ vehicleNo: '', moiNo: '', makeModel: '', acr: '' })
  const [accidentDescription, setAccidentDescription] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [observationRows, setObservationRows] = useState<number[]>([0])
  const [observationText, setObservationText] = useState<Record<number, string>>({})
  const [observationPhotos, setObservationPhotos] = useState<Record<number, [string | null, string | null]>>({})
  const [signatures, setSignatures] = useState<ReportData['signatures']>({
    areaEngineer: { imageSrc: null, date: '' },
    zonalEngineer: { imageSrc: null, date: '' },
    managerMotor: { imageSrc: null, date: '' },
  })
  const nextObsId = useRef(1)

  const addObservationRow = () => {
    setObservationRows(prev => [...prev, nextObsId.current++])
  }

  const handleObsPhoto = (id: number, idx: number, file: File) => {
    normalizeImage(file).then(src => {
      setObservationPhotos(prev => {
        const current = prev[id] ?? [null, null]
        const updated: [string | null, string | null] = [...current]
        updated[idx] = src
        return { ...prev, [id]: updated }
      })
    })
  }

  const removeObsPhoto = (id: number, idx: number) => {
    setObservationPhotos(prev => {
      const current = prev[id] ?? [null, null]
      const updated: [string | null, string | null] = [...current]
      updated[idx] = null
      return { ...prev, [id]: updated }
    })
  }

  const removeObservationRow = (id: number) => {
    setObservationRows(prev => prev.filter(rowId => rowId !== id))
    setObservationText(prev => { const next = { ...prev }; delete next[id]; return next })
    setObservationPhotos(prev => { const next = { ...prev }; delete next[id]; return next })
  }

  const buildReportData = (): ReportData => ({
    ...vehicleFields,
    accidentDescription,
    recommendation,
    observations: observationRows.map(id => ({
      id,
      text: observationText[id] ?? '',
      photos: observationPhotos[id] ?? [null, null],
    })),
    signatures,
  })

  const handleDownloadDocx = () => downloadDocx(buildReportData())

  return (
    <>
      <h1>Technical Investigation Report</h1>

      <div className="section-break">
        <h2>Vehicle Details</h2>
        <table>
          <tbody>
            {VEHICLE_FIELDS.map(({ field, label }) => (
              <tr key={field}>
                <th>{label}</th>
                <td>
                  <input
                    type="text"
                    value={vehicleFields[field]}
                    onChange={(e) => setVehicleFields(prev => ({ ...prev, [field]: e.target.value }))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-break">
        <h2>Description of the Accident [as per the Driver / Customer]</h2>
        <textarea
          className="report-textarea no-print"
          rows={6}
          value={accidentDescription}
          onChange={(e) => setAccidentDescription(e.target.value)}
          placeholder="Enter accident description..."
        />
        <div className="textarea-print print-only">{accidentDescription}</div>
      </div>

      <div className="section-break">
        <h2>Observations and Comments</h2>
        {observationRows.map((id, i) => (
          <div className="obs-block" key={id}>
            <div className="obs-header">
              <span className="obs-num">{i + 1}.</span>
              <button className="obs-remove-btn no-print" onClick={() => removeObservationRow(id)}>&times;</button>
              <input
                type="text"
                className="obs-text-input"
                placeholder="Observation / Comment"
                value={observationText[id] ?? ''}
                onChange={(e) => setObservationText(prev => ({ ...prev, [id]: e.target.value }))}
              />
            </div>
            <div className="obs-images">
              {([0, 1] as const).map(imgIdx => {
                const photos = observationPhotos[id] ?? [null, null]
                return (
                  <ObservationImageSlot
                    key={imgIdx}
                    idx={imgIdx}
                    src={photos[imgIdx]}
                    onChange={(_, file) => handleObsPhoto(id, imgIdx, file)}
                    onRemove={(_) => removeObsPhoto(id, imgIdx)}
                  />
                )
              })}
            </div>
          </div>
        ))}
        <button className="add-row-btn no-print" onClick={addObservationRow}>+ Add Point</button>
      </div>

      <div className="section-break">
        <h2>Recommendation</h2>
        <textarea
          className="report-textarea no-print"
          rows={6}
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value)}
          placeholder="Enter recommendation..."
        />
        <div className="textarea-print print-only">{recommendation}</div>
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
