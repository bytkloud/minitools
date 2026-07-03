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
import type { ReportData, SignOff } from './report-types'

// ─── Design tokens (shared with mofa/docx-builder.ts) ─────────────────────────

const FONT = 'Calibri'
const C_TEXT = '1A1A1A'
const C_HEADING_BG = 'F0F0F0'
const C_HEADING_BORDER = '333333'
const C_LABEL_BG = 'F5F5F5'
const C_BORDER = '999999'

const B_CELL = { style: BorderStyle.SINGLE, size: 4, color: C_BORDER } as const

const BORDERS_CELL = { top: B_CELL, bottom: B_CELL, left: B_CELL, right: B_CELL }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function run(content: string, opts: ConstructorParameters<typeof TextRun>[0] = {}) {
  return new TextRun({ text: content, font: FONT, color: C_TEXT, ...(typeof opts === 'string' ? {} : opts) })
}

function fmtRs(raw: string): string {
  const n = parseFloat(raw)
  if (!raw || isNaN(n)) return ''
  return 'Rs. ' + new Intl.NumberFormat('en-LK').format(n)
}

function fmtDate(raw: string): string {
  if (!raw) return ''
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
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

function refLine(refNo: string) {
  return new Paragraph({
    children: [run(`TL/MOFA/${refNo || '________'}`, { bold: true, size: 20 })],
    alignment: AlignmentType.RIGHT,
    spacing: { after: 120 },
  })
}

function titleBlock() {
  return new Paragraph({
    children: [
      run('M - O - F - A', { bold: true, size: 32 }),
      new TextRun({ text: '', break: 1 }),
      run('MEMORANDUM', { bold: true, size: 26 }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 280 },
    border: { bottom: { style: BorderStyle.THICK, size: 12, color: C_HEADING_BORDER } },
  })
}

function peopleLabel(label: string) {
  return new Paragraph({
    children: [run(label, { bold: true, size: 22 })],
    spacing: { before: 160, after: 80 },
  })
}

function peopleHeaderCell(text: string, widthPct: number) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    borders: BORDERS_CELL,
    shading: { type: ShadingType.CLEAR, fill: C_LABEL_BG },
    children: [
      new Paragraph({
        children: [run(text, { bold: true, size: 19 })],
        spacing: { before: 40, after: 40 },
        indent: { left: 60 },
      }),
    ],
  })
}

function peopleTable(rows: SignOff[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          peopleHeaderCell('Name', 22),
          peopleHeaderCell('Designation', 36),
          peopleHeaderCell('Signature', 42),
        ],
      }),
      ...rows.map(
        (row) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 22, type: WidthType.PERCENTAGE },
                borders: BORDERS_CELL,
                children: [
                  new Paragraph({
                    children: [run(row.name, { size: 20 })],
                    spacing: { before: 60, after: 60 },
                    indent: { left: 60 },
                  }),
                ],
              }),
              new TableCell({
                width: { size: 36, type: WidthType.PERCENTAGE },
                borders: BORDERS_CELL,
                children: [
                  new Paragraph({
                    children: [run(row.title, { size: 20 })],
                    spacing: { before: 60, after: 60 },
                    indent: { left: 60 },
                  }),
                ],
              }),
              new TableCell({
                width: { size: 42, type: WidthType.PERCENTAGE },
                borders: BORDERS_CELL,
                margins: { top: 60, bottom: 60, left: 60, right: 60 },
                children: [
                  row.imageSrc
                    ? new Paragraph({
                        children: [
                          new ImageRun({
                            data: toUint8Array(row.imageSrc),
                            transformation: { width: 170, height: 65 },
                            type: imgType(row.imageSrc),
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      })
                    : new Paragraph({ children: [run(' ', { size: 32 })] }),
                ],
              }),
            ],
          })
      ),
    ],
  })
}

function dateLine(date: string) {
  return new Paragraph({
    children: [run('Date : ', { bold: true, size: 22 }), run(fmtDate(date), { size: 22 })],
    spacing: { before: 200, after: 200 },
  })
}

function subjectLine(text: string) {
  return new Paragraph({
    children: [run(`SUBJECT : ${text}`, { bold: true, size: 22 })],
    shading: { type: ShadingType.CLEAR, fill: C_HEADING_BG },
    border: { left: { style: BorderStyle.THICK, size: 24, color: C_HEADING_BORDER } },
    indent: { left: 120 },
    spacing: { before: 120, after: 200 },
  })
}

function bodyParagraph(content: string) {
  return new Paragraph({
    children: [run(content, { size: 22 })],
    spacing: { after: 200, line: 340 },
  })
}

function detailsTable(data: ReportData): Table {
  const period = data.coverFrom && data.coverTo ? `${fmtDate(data.coverFrom)} to ${fmtDate(data.coverTo)}` : ''

  const rows: [string, string][] = [
    ['Vehicle No.', data.vehicleNo],
    ['Claim No', data.claimNo],
    ['Date of Accident', fmtDate(data.dateOfAccident)],
    ['Period of Cover', period],
    ['Sum Insured', fmtRs(data.sumInsured)],
    ['Valuation Amount', fmtRs(data.valuationAmount)],
    ['Payable Amount', fmtRs(data.payableAmount)],
  ]

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 38, type: WidthType.PERCENTAGE },
              borders: BORDERS_CELL,
              shading: { type: ShadingType.CLEAR, fill: C_LABEL_BG },
              children: [
                new Paragraph({
                  children: [run(label, { bold: true, size: 20 })],
                  spacing: { before: 60, after: 60 },
                  indent: { left: 80 },
                }),
              ],
            }),
            new TableCell({
              width: { size: 62, type: WidthType.PERCENTAGE },
              borders: BORDERS_CELL,
              children: [
                new Paragraph({
                  children: [run(value, { size: 20 })],
                  spacing: { before: 60, after: 60 },
                  indent: { left: 80 },
                }),
              ],
            }),
          ],
        })
    ),
  })
}

function closingBlock(data: ReportData['closing']): Paragraph[] {
  const paragraphs: Paragraph[] = []

  paragraphs.push(
    new Paragraph({
      children: data.imageSrc
        ? [
            new ImageRun({
              data: toUint8Array(data.imageSrc),
              transformation: { width: 150, height: 70 },
              type: imgType(data.imageSrc),
            }),
          ]
        : [run(' ', { size: 48 })],
      spacing: { before: 300, after: 80 },
    })
  )
  paragraphs.push(
    new Paragraph({
      children: [run(data.name || ' ', { bold: true, size: 21 })],
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
      spacing: { before: 40 },
    })
  )
  paragraphs.push(
    new Paragraph({
      children: [run(data.designation || ' ', { size: 20 })],
      spacing: { before: 20 },
    })
  )

  return paragraphs
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function buildDocx(data: ReportData): Promise<Blob> {
  const children = [
    refLine(data.refNo),
    titleBlock(),

    peopleLabel('To :'),
    peopleTable(data.to),

    peopleLabel('Through :'),
    peopleTable([data.through]),

    peopleLabel('From :'),
    peopleTable([data.from]),

    dateLine(data.date),

    subjectLine('MOFA APPROVAL FOR TOTAL LOSS SETTLEMENT'),

    bodyParagraph(
      'As per the investigation carried out by us revealed that this is a genuine claim and no any policy condition violation.'
    ),

    detailsTable(data),

    new Paragraph({
      children: [run('Kindly grant your approval.', { size: 22 })],
      spacing: { before: 240, after: 0 },
    }),

    ...closingBlock(data.closing),
  ]

  const doc = new Document({
    creator: 'MOFA Claims Tool',
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 22, color: C_TEXT },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, bottom: 1440, left: 1800, right: 1440 } },
        },
        children,
      },
    ],
  })

  return Packer.toBlob(doc)
}

export async function downloadDocx(data: ReportData, filename = 'mofa-claims.docx') {
  const blob = await buildDocx(data)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
