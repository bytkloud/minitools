import { useState, useRef } from 'react'

const SIGNATURES = [
  { key: 'areaEngineer', label: 'Area Engineer' },
  { key: 'zonalEngineer', label: 'Zonal Engineer' },
  { key: 'managerMotor', label: 'Manager Motor Engineer' },
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

export default function TechnicalInvestigationReportForm() {
  const [accidentDescription, setAccidentDescription] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [observationRows, setObservationRows] = useState<number[]>([0])
  const [observationText, setObservationText] = useState<Record<number, string>>({})
  const [observationPhotos, setObservationPhotos] = useState<Record<number, [string | null, string | null]>>({})
  const nextObsId = useRef(1)

  const addObservationRow = () => {
    setObservationRows(prev => [...prev, nextObsId.current++])
  }

  const handleObsPhoto = (id: number, idx: number, file: File) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      setObservationPhotos(prev => {
        const current = prev[id] ?? [null, null]
        const updated: [string | null, string | null] = [...current]
        updated[idx] = ev.target?.result as string
        return { ...prev, [id]: updated }
      })
    }
    reader.readAsDataURL(file)
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
    setObservationText(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setObservationPhotos(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  return (
    <>
      <h1>Technical Investigation Report</h1>

      <div className="section-break">
        <h2>Vehicle Details</h2>
        <table>
          <tbody>
            {([
              ['Vehicle No', 'vehicleNo'],
              ['MOI No', 'moiNo'],
              ['Make / Model', 'makeModel'],
              ['ACR', 'acr'],
            ] as const).map(([label, field]) => (
              <tr key={field}>
                <th>{label}</th>
                <td><input type="text" data-field={field} /></td>
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
                data-field={`observation_${id}`}
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
            <SignatureUpload key={key} sigKey={key} label={label} />
          ))}
        </div>
      </div>

      <button className="print-pdf-btn no-print" onClick={() => window.print()}>Print to PDF</button>
    </>
  )
}
