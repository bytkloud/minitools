import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import type { PersonContact, PhotoSectionKey, ReportData } from './report-types'

// ─── Design tokens ────────────────────────────────────────────────────────────

const FONT = 'Calibri'
const C_TEXT = '1A1A1A'
const C_HEADING_BG = 'F0F0F0'
const C_HEADING_BORDER = '333333'
const C_LABEL_BG = 'F5F5F5'
const C_BORDER = '999999'

// ─── Border presets ───────────────────────────────────────────────────────────

const B_NONE = { style: BorderStyle.NONE, size: 0, color: 'auto' } as const
const B_CELL = { style: BorderStyle.SINGLE, size: 4, color: C_BORDER } as const

const BORDERS_NONE = { top: B_NONE, bottom: B_NONE, left: B_NONE, right: B_NONE, insideHorizontal: B_NONE, insideVertical: B_NONE }
const BORDERS_CELL = { top: B_CELL, bottom: B_CELL, left: B_CELL, right: B_CELL }

// ─── Primitives ───────────────────────────────────────────────────────────────

function run(content: string, opts: ConstructorParameters<typeof TextRun>[0] = {}) {
  return new TextRun({ text: content, font: FONT, color: C_TEXT, ...(typeof opts === 'string' ? {} : opts) })
}

function imgType(dataUrl: string): 'jpg' | 'png' | 'gif' | 'bmp' {
  if (dataUrl.includes('image/png')) return 'png'
  if (dataUrl.includes('image/gif')) return 'gif'
  if (dataUrl.includes('image/bmp')) return 'bmp'
  return 'jpg'
}

function toUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const arr = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
  return arr
}

// ─── Block builders ───────────────────────────────────────────────────────────

function titleBlock() {
  return new Paragraph({
    children: [run('INVESTIGATION DETAILS', { bold: true, size: 32 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    border: { bottom: { style: BorderStyle.THICK, size: 12, color: C_HEADING_BORDER } },
  })
}

function sectionHeading(label: string) {
  return new Paragraph({
    children: [run(label.toUpperCase(), { bold: true, size: 22 })],
    shading: { type: ShadingType.CLEAR, fill: C_HEADING_BG },
    border: { left: { style: BorderStyle.THICK, size: 24, color: C_HEADING_BORDER } },
    indent: { left: 120 },
    spacing: { before: 320, after: 160 },
    keepNext: true,
  })
}

function bodyParagraph(content: string) {
  return new Paragraph({
    children: [run(content, { size: 20 })],
    spacing: { line: 360 },
  })
}

function checklistRow(num: number, label: string, checked: boolean) {
  return new Paragraph({
    children: [run(`${checked ? '☑' : '☐'}  ${num}. ${label}`, { size: 20 })],
    spacing: { before: 40, after: 40 },
  })
}

function checklistRowPlain(num: number, label: string) {
  return new Paragraph({
    children: [run(`${num}. ${label}`, { size: 20 })],
    spacing: { before: 40, after: 40 },
  })
}

function buildChecklist(data: ReportData) {
  const rows: Paragraph[] = []
  let num = 0

  data.checklist.forEach((item) => {
    num += 1
    rows.push(checklistRow(num, item.label, item.checked))
  })

  data.customItems.forEach((item) => {
    num += 1
    rows.push(checklistRowPlain(num, item.label))
  })

  return rows
}

function buildVehicleTable(data: ReportData) {
  const rows: [string, string][] = [
    ['Vehicle Number', data.vehicleNo || '-'],
    ['MOI Number', data.moiNo || '-'],
    ['Accident Date', data.accidentDate ? new Date(data.accidentDate).toLocaleDateString() : '-'],
  ]
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([key, value]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            borders: BORDERS_CELL,
            shading: { type: ShadingType.CLEAR, fill: C_LABEL_BG },
            children: [new Paragraph({
              children: [run(key, { bold: true, size: 20 })],
              spacing: { before: 60, after: 60 },
              indent: { left: 80 },
            })],
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            borders: BORDERS_CELL,
            children: [new Paragraph({
              children: [run(value, { size: 20 })],
              spacing: { before: 60, after: 60 },
              indent: { left: 80 },
            })],
          }),
        ],
      })
    ),
  })
}

function buildPersonTable(person: PersonContact) {
  const contacts = person.contacts.filter(Boolean).join(', ') || '-'
  const rows: [string, string][] = [
    ['Name', person.name || '-'],
    ['Contact Number', contacts],
  ]
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([key, value]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            borders: BORDERS_CELL,
            shading: { type: ShadingType.CLEAR, fill: C_LABEL_BG },
            children: [new Paragraph({
              children: [run(key, { bold: true, size: 20 })],
              spacing: { before: 60, after: 60 },
              indent: { left: 80 },
            })],
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            borders: BORDERS_CELL,
            children: [new Paragraph({
              children: [run(value, { size: 20 })],
              spacing: { before: 60, after: 60 },
              indent: { left: 80 },
            })],
          }),
        ],
      })
    ),
  })
}

function buildPhotoGrid(photos: string[]) {
  const tables: Table[] = []
  for (let i = 0; i < photos.length; i += 2) {
    const pair = photos.slice(i, i + 2)
    tables.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BORDERS_NONE,
      rows: [
        new TableRow({
          children: [
            ...pair.map((src) =>
              new TableCell({
                borders: BORDERS_NONE,
                margins: { top: 60, bottom: 60, left: 60, right: 60 },
                children: [new Paragraph({
                  children: [new ImageRun({
                    data: toUint8Array(src),
                    transformation: { width: 290, height: 218 },
                    type: imgType(src),
                  })],
                  alignment: AlignmentType.CENTER,
                })],
              })
            ),
            ...(pair.length === 1
              ? [new TableCell({ borders: BORDERS_NONE, children: [new Paragraph('')] })]
              : []),
          ],
        }),
      ],
    }))
  }
  return tables
}

// ─── Public API ───────────────────────────────────────────────────────────────

const PHOTO_SECTIONS: { key: PhotoSectionKey; label: string }[] = [
  { key: 'policyDetails', label: 'Policy Details' },
  { key: 'intimationDetails', label: 'Intimation Details' },
  { key: 'onsiteDetails', label: 'Onsite Details' },
  { key: 'driverDetails', label: 'Driver Details' },
  { key: 'accidentPhotos', label: 'Accident Photos' },
]

export async function downloadDocx(
  data: ReportData,
  filename = 'investigation-request.docx',
) {
  const photoChildren = PHOTO_SECTIONS.flatMap(({ key, label }) => {
    const photos = data.photos[key]
    if (photos.length === 0) return [sectionHeading(label), bodyParagraph('No photos attached.')]
    return [sectionHeading(label), ...buildPhotoGrid(photos)]
  })

  const doc = new Document({
    creator: 'Investigation Request Tool',
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 22, color: C_TEXT },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1800, right: 1440 } },
      },
      children: [
        titleBlock(),

        buildVehicleTable(data),

        bodyParagraph('Kindly check following key areas'),
        ...buildChecklist(data),

        sectionHeading('Insured'),
        buildPersonTable(data.insured),

        sectionHeading('Driver'),
        buildPersonTable(data.driver),

        sectionHeading('Assessor'),
        buildPersonTable(data.assessor),

        ...photoChildren,

        new Paragraph({
          children: [run('Thanks', { size: 20 })],
          spacing: { before: 320 },
        }),
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
