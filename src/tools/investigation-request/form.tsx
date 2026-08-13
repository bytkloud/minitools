import { useState, useRef } from 'react'
import { normalizeImage } from '../../utils/normalizeImage'
import { downloadDocx } from './docx-builder'
import type { ChecklistItem, CustomChecklistItem, PersonContact, PhotoSectionKey, ReportData } from './report-types'

const CHECKLIST_DEFAULTS: ChecklistItem[] = [
  { id: 'usage', label: 'Usage of vehicle', checked: false },
  { id: 'ownership', label: 'Ownership of vehicle', checked: false },
  { id: 'substitute', label: 'Driver substitute', checked: false },
  { id: 'drunk', label: 'Driving under the influence of alcohol (drunk driving)', checked: false },
  { id: 'accidentDateTime', label: 'Accident Date/Time', checked: false },
  { id: 'allareas', label: 'All areas', checked: false },
  { id: 'illegal', label: 'Illegal usage', checked: false },
]

const PHOTO_SECTIONS: { key: PhotoSectionKey; label: string }[] = [
  { key: 'policyDetails', label: 'Policy Details' },
  { key: 'intimationDetails', label: 'Intimation Details' },
  { key: 'onsiteDetails', label: 'Onsite Details' },
  { key: 'driverDetails', label: 'Driver Details' },
  { key: 'accidentPhotos', label: 'Accident Photos' },
]

function ChecklistRow({
  item,
  onToggle,
  onRemove,
}: {
  item: ChecklistItem
  onToggle: (checked: boolean) => void
  onRemove?: () => void
}) {
  return (
    <div className={`checklist-row${item.checked ? '' : ' checklist-unchecked'}`}>
      <label className="checklist-label">
        <input type="checkbox" checked={item.checked} onChange={(e) => onToggle(e.target.checked)} />
        <span>{item.label}</span>
      </label>
      {onRemove && (
        <button className="remove-btn-inline no-print" onClick={onRemove}>&times;</button>
      )}
    </div>
  )
}

function CustomChecklistRow({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="checklist-row">
      <span className="checklist-label checklist-label-plain">{label}</span>
      <button className="remove-btn-inline no-print" onClick={onRemove}>&times;</button>
    </div>
  )
}

function ContactList({
  contacts,
  onChange,
}: {
  contacts: string[]
  onChange: (contacts: string[]) => void
}) {
  const update = (i: number, value: string) => onChange(contacts.map((c, idx) => (idx === i ? value : c)))
  const add = () => onChange([...contacts, ''])
  const remove = (i: number) => onChange(contacts.filter((_, idx) => idx !== i))

  return (
    <div className="contact-list">
      {contacts.map((c, i) => (
        <div className="contact-row" key={i}>
          <input
            type="tel"
            value={c}
            placeholder="Contact number"
            onChange={(e) => update(i, e.target.value)}
          />
          {contacts.length > 1 && (
            <button className="remove-btn-inline no-print" onClick={() => remove(i)}>&times;</button>
          )}
        </div>
      ))}
      <button className="add-row-btn no-print" onClick={add}>+ Add number</button>
    </div>
  )
}

function PersonBlock({
  label,
  value,
  onChange,
}: {
  label: string
  value: PersonContact
  onChange: (value: PersonContact) => void
}) {
  return (
    <div className="section-break person-block">
      <h2>{label}</h2>
      <table>
        <tbody>
          <tr>
            <th>Name</th>
            <td>
              <input
                type="text"
                value={value.name}
                onChange={(e) => onChange({ ...value, name: e.target.value })}
              />
            </td>
          </tr>
          <tr>
            <th>Contact Number</th>
            <td>
              <ContactList contacts={value.contacts} onChange={(contacts) => onChange({ ...value, contacts })} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function PhotoGallery({
  label,
  photos,
  onAdd,
  onRemove,
}: {
  label: string
  photos: string[]
  onAdd: (file: File) => void
  onRemove: (idx: number) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="section-break">
      <h2>{label}</h2>
      <div className="photo-gallery">
        {photos.map((src, idx) => (
          <div className="photo-thumb" key={idx}>
            <img src={src} alt={`${label} ${idx + 1}`} />
            <button className="remove-btn no-print" onClick={() => onRemove(idx)}>&times;</button>
          </div>
        ))}
        <div className="photo-add-tile no-print" onClick={() => inputRef.current?.click()}>
          <span>+ Add Photo</span>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onAdd(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

export default function InvestigationRequestForm() {
  const [vehicleNo, setVehicleNo] = useState('')
  const [moiNo, setMoiNo] = useState('')
  const [accidentDate, setAccidentDate] = useState('')

  const [checklist, setChecklist] = useState<ChecklistItem[]>(CHECKLIST_DEFAULTS)
  const [customItems, setCustomItems] = useState<CustomChecklistItem[]>([])
  const [newItemText, setNewItemText] = useState('')
  const nextCustomId = useRef(0)

  const [insured, setInsured] = useState<PersonContact>({ name: '', contacts: [''] })
  const [driver, setDriver] = useState<PersonContact>({ name: '', contacts: [''] })
  const [assessor, setAssessor] = useState<PersonContact>({ name: '', contacts: [''] })

  const [photos, setPhotos] = useState<Record<PhotoSectionKey, string[]>>({
    policyDetails: [],
    intimationDetails: [],
    onsiteDetails: [],
    driverDetails: [],
    accidentPhotos: [],
  })

  const addCustomItem = () => {
    const label = newItemText.trim()
    if (!label) return
    setCustomItems((prev) => [...prev, { id: `custom-${nextCustomId.current++}`, label }])
    setNewItemText('')
  }

  const removeCustomItem = (id: string) => {
    setCustomItems((prev) => prev.filter((item) => item.id !== id))
  }

  const addPhoto = (key: PhotoSectionKey, file: File) => {
    normalizeImage(file).then((src) => {
      setPhotos((prev) => ({ ...prev, [key]: [...prev[key], src] }))
    })
  }

  const removePhoto = (key: PhotoSectionKey, idx: number) => {
    setPhotos((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) }))
  }

  const buildReportData = (): ReportData => ({
    vehicleNo,
    moiNo,
    accidentDate,
    checklist,
    customItems,
    insured,
    driver,
    assessor,
    photos,
  })

  const filename = vehicleNo ? `${vehicleNo}.docx` : 'investigation-request.docx'

  const handlePrintPDF = () => {
    const prev = document.title
    document.title = vehicleNo || 'investigation-request'
    window.print()
    document.title = prev
  }

  const handleDownloadDocx = () => downloadDocx(buildReportData(), filename)

  return (
    <>
      <h1>Investigation Details</h1>

      <div className="section-break">
        <table>
          <tbody>
            <tr>
              <th>Vehicle Number</th>
              <td>
                <input type="text" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} />
              </td>
            </tr>
            <tr>
              <th>MOI Number</th>
              <td>
                <input type="text" value={moiNo} onChange={(e) => setMoiNo(e.target.value)} />
              </td>
            </tr>
            <tr>
              <th>Accident Date</th>
              <td>
                <input type="date" value={accidentDate} onChange={(e) => setAccidentDate(e.target.value)} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="section-break">
        <p className="ir-intro">Kindly check following key areas</p>

        <div className="checklist">
          {checklist.map((item, i) => (
            <ChecklistRow
              key={item.id}
              item={{ ...item, label: `${i + 1}. ${item.label}` }}
              onToggle={(checked) =>
                setChecklist((prev) => prev.map((it) => (it.id === item.id ? { ...it, checked } : it)))
              }
            />
          ))}

          {customItems.map((item, i) => (
            <CustomChecklistRow
              key={item.id}
              label={`${checklist.length + i + 1}. ${item.label}`}
              onRemove={() => removeCustomItem(item.id)}
            />
          ))}

          <div className="checklist-add-row no-print">
            <input
              type="text"
              placeholder="Add a custom check area..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addCustomItem()
              }}
            />
            <button className="add-row-btn" onClick={addCustomItem}>+ Add</button>
          </div>
        </div>
      </div>

      <PersonBlock label="Insured" value={insured} onChange={setInsured} />
      <PersonBlock label="Driver" value={driver} onChange={setDriver} />
      <PersonBlock label="Assessor" value={assessor} onChange={setAssessor} />

      {PHOTO_SECTIONS.map(({ key, label }) => (
        <PhotoGallery
          key={key}
          label={label}
          photos={photos[key]}
          onAdd={(file) => addPhoto(key, file)}
          onRemove={(idx) => removePhoto(key, idx)}
        />
      ))}

      <p className="ir-thanks">Thanks</p>

      <div className="no-print action-buttons">
        <button className="print-pdf-btn" onClick={handlePrintPDF}>Print to PDF</button>
        <button className="print-pdf-btn" onClick={handleDownloadDocx}>Download DOCX</button>
      </div>
    </>
  )
}
