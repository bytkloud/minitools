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
import type { ReportData, SignatureData } from './report-types'
import { resolveSignatureLabel } from '../../data/signatureNames'
import { buildWatermarkHeader } from './watermark'

// ─── Design tokens ────────────────────────────────────────────────────────────

const FONT = 'Calibri'
const C_TEXT = '1A1A1A'
const C_MUTED = '666666'
const C_HEADING_BG = 'F0F0F0'
const C_HEADING_BORDER = '333333'
const C_LABEL_BG = 'F5F5F5'
const C_BORDER = '999999'

// ─── Border presets ───────────────────────────────────────────────────────────

const C_RED = 'D32F2F'

const B_NONE = { style: BorderStyle.NONE, size: 0, color: 'auto' } as const
const B_CELL = { style: BorderStyle.SINGLE, size: 4, color: C_BORDER } as const
const B_SIG  = { style: BorderStyle.SINGLE, size: 6, color: '000000' } as const
const B_RED  = { style: BorderStyle.SINGLE, size: 18, color: C_RED } as const
const B_RED_LINE = { style: BorderStyle.SINGLE, size: 4, color: C_RED } as const

const BORDERS_NONE = { top: B_NONE, bottom: B_NONE, left: B_NONE, right: B_NONE, insideHorizontal: B_NONE, insideVertical: B_NONE }
const BORDERS_CELL = { top: B_CELL, bottom: B_CELL, left: B_CELL, right: B_CELL }
const BORDERS_SIG  = { top: B_NONE, bottom: B_SIG,  left: B_NONE, right: B_NONE }
const BORDERS_RED_BOX = { top: B_RED, bottom: B_RED, left: B_RED, right: B_RED }
const BORDERS_RED_LINE = { top: B_NONE, bottom: B_RED_LINE, left: B_NONE, right: B_NONE }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function run(content: string, opts: ConstructorParameters<typeof TextRun>[0] = {}) {
  return new TextRun({ text: content, font: FONT, color: C_TEXT, ...(typeof opts === 'string' ? {} : opts) })
}

function fmtLKR(raw: string | number): string {
  const n = typeof raw === 'number' ? raw : parseFloat(raw)
  if (!raw || isNaN(n) || n === 0) return ''
  return 'LKR ' + new Intl.NumberFormat('en-LK').format(n)
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
    children: [run('MOFA', { bold: true, size: 36 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    border: { bottom: { style: BorderStyle.THICK, size: 12, color: C_HEADING_BORDER } },
  })
}

function sectionHeading(label: string) {
  return new Paragraph({
    children: [run(label.toUpperCase(), { bold: true, size: 22 })],
    shading: { type: ShadingType.CLEAR, fill: C_HEADING_BG },
    border: { left: { style: BorderStyle.THICK, size: 24, color: C_HEADING_BORDER } },
    indent: { left: 120 },
    spacing: { before: 280, after: 140 },
    keepNext: true,
  })
}

function bodyParagraph(content: string, opts: { bold?: boolean; size?: number } = {}) {
  return new Paragraph({
    children: [run(content, { size: opts.size ?? 22, bold: opts.bold })],
    spacing: { after: 120, line: 340 },
  })
}

function labelValueTable(rows: [string, string][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 38, type: WidthType.PERCENTAGE },
            borders: BORDERS_CELL,
            shading: { type: ShadingType.CLEAR, fill: C_LABEL_BG },
            children: [new Paragraph({
              children: [run(label, { bold: true, size: 20 })],
              spacing: { before: 60, after: 60 },
              indent: { left: 80 },
            })],
          }),
          new TableCell({
            width: { size: 62, type: WidthType.PERCENTAGE },
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

function headerCell(text: string, widthPct: number) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    borders: BORDERS_CELL,
    shading: { type: ShadingType.CLEAR, fill: C_HEADING_BG },
    children: [new Paragraph({
      children: [run(text, { bold: true, size: 20 })],
      spacing: { before: 60, after: 60 },
      indent: { left: 80 },
    })],
  })
}

function buildTyreTable(tyres: ReportData['tyres']): Table {
  const rows: [string, string][] = [
    ['Front RHS',      tyres.FrontRhs],
    ['Front LHS',      tyres.FrontLhs],
    ['Rear RHS – In',  tyres.RearRhsIn],
    ['Rear RHS – Out', tyres.RearRhsOut],
    ['Rear LHS – In',  tyres.RearLhsIn],
    ['Rear LHS – Out', tyres.RearLhsOut],
  ]
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [headerCell('Position', 30), headerCell('Condition', 70)] }),
      ...rows.map(([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              borders: BORDERS_CELL,
              shading: { type: ShadingType.CLEAR, fill: C_LABEL_BG },
              children: [new Paragraph({
                children: [run(label, { bold: true, size: 20 })],
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
    ],
  })
}

function buildSignaturesTable(sigs: ReportData['signatures']): Table {
  const entries: [string, SignatureData][] = [
    [resolveSignatureLabel('areaEngineer', sigs.areaEngineer.name, 'Area Engineer'), sigs.areaEngineer],
    ['Zonal Engineer 1',       sigs.zonalEngineer1],
    ['Zonal Engineer 2',       sigs.zonalEngineer2],
    ['Manager Motor Engineer', sigs.managerMotor],
  ]

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDERS_NONE,
    rows: [
      // Label row
      new TableRow({
        children: entries.map(([label]) =>
          new TableCell({
            borders: BORDERS_NONE,
            children: [new Paragraph({
              children: [run(label, { bold: true, size: 20 })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 80 },
            })],
          })
        ),
      }),
      // Signature image row
      new TableRow({
        children: entries.map(([, sig]) =>
          new TableCell({
            borders: BORDERS_SIG,
            margins: { top: 60, bottom: 60, left: 60, right: 60 },
            children: [
              sig.imageSrc
                ? new Paragraph({
                    children: [new ImageRun({
                      data: toUint8Array(sig.imageSrc),
                      transformation: { width: 150, height: 80 },
                      type: imgType(sig.imageSrc),
                    })],
                    alignment: AlignmentType.CENTER,
                  })
                : new Paragraph({ children: [run(' ', { size: 48 })] }),
            ],
          })
        ),
      }),
      // Name row
      new TableRow({
        children: entries.map(([, sig]) =>
          new TableCell({
            borders: BORDERS_NONE,
            children: [new Paragraph({
              children: [run(sig.name || ' ', { bold: true, size: 20 })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 40 },
            })],
          })
        ),
      }),
      // Date row
      new TableRow({
        children: entries.map(([, sig]) =>
          new TableCell({
            borders: BORDERS_NONE,
            children: [new Paragraph({
              children: [run(`Date: ${sig.date}`, { size: 18, color: C_MUTED })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 40 },
            })],
          })
        ),
      }),
    ],
  })
}

function buildSavingDetailsBox(data: ReportData): Table {
  const offerNum = parseFloat(data.offerAmount) || 0
  const extraSaving =
    data.settlementBasis === 'Full and final Offer' && data.acr > 0 && offerNum > 0
      ? data.acr - offerNum
      : null

  const partsSavingNum = parseFloat(data.partsSaving) || 0
  const totalSavings =
    partsSavingNum > 0 || extraSaving !== null
      ? partsSavingNum + (extraSaving ?? 0)
      : null

  const rows: [string, string | null][] = [
    ['Date of Accident:', data.accidentDate || null],
    ['Date of Garage Intimation:', data.garageIntimationDate || null],
    ['Month of Repair Completion:', data.repairCompletionMonth || null],
    ['Parts Saving (Replace to Repair):', fmtLKR(data.partsSaving) || null],
    ['Extra Saving (ACR - Full & Final):', extraSaving !== null ? fmtLKR(extraSaving) : null],
    ['TOTAL SAVINGS:', totalSavings !== null ? fmtLKR(totalSavings) : null],
  ]

  const innerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDERS_NONE,
    rows: rows.map(([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            borders: BORDERS_NONE,
            children: [new Paragraph({
              children: [run(label, { bold: true, size: 20, color: C_RED })],
              spacing: { before: 140, after: 40 },
            })],
          }),
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            borders: BORDERS_RED_LINE,
            children: [new Paragraph({
              children: [run(value ?? ' ', { bold: true, size: 20, color: C_RED })],
              spacing: { before: 140, after: 40 },
            })],
          }),
        ],
      })
    ),
  })

  return new Table({
    width: { size: 60, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.LEFT,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: BORDERS_RED_BOX,
            margins: { top: 200, bottom: 200, left: 200, right: 200 },
            children: [
              new Paragraph({
                children: [run('SAVING DETAILS', { bold: true, size: 26, color: C_RED })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 160 },
              }),
              innerTable,
            ],
          }),
        ],
      }),
    ],
  })
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function buildDocx(data: ReportData): Promise<Blob> {
  const vehicleRows: [string, string][] = [
    ['Vehicle No', data.vehicleNo],
    ['MOI', data.moi],
    ['Model', data.model],
    ['PAV', fmtLKR(data.pav)],
    ['SUM', fmtLKR(data.sum)],
    ['Under Insurance Penalty %', data.underInsurancePct ? `${data.underInsurancePct}%` : ''],
  ]

  const isEstimateBasis = data.settlementBasis === 'Estimate Basis'
  const offerRows: [string, string][] = [
    ['Labor', fmtLKR(data.labor)],
    ['Parts', fmtLKR(data.parts)],
    ['ACR = Labor + Parts', fmtLKR(data.acr)],
    // Offer Amount and Payable Amount are omitted on Estimate Basis (matches form UI/print)
    ...(isEstimateBasis
      ? []
      : ([['Offer Amount', fmtLKR(data.offerAmount)]] as [string, string][])),
    ['Under Insurance Amount', fmtLKR(data.underInsuranceAmt)],
    ['Policy Excess', fmtLKR(data.policyExcess)],
    ...(isEstimateBasis
      ? []
      : ([['Payable Amount', fmtLKR(data.payableAmount)]] as [string, string][])),
  ]

  const itemParagraphs = data.items.map((item, i) =>
    new Paragraph({
      children: [run(`${i + 3})  ${item}`, { size: 22 })],
      spacing: { before: 100, after: 60 },
    })
  )

  const children = [
    titleBlock(),

    ...(data.salutation
      ? [bodyParagraph(`Dear ${data.salutation},`)]
      : []),

    bodyParagraph(`Kindly need your approval to Process as ${data.settlementBasis}.`),

    sectionHeading('1) Vehicle Details Below Mentioned'),
    labelValueTable(vehicleRows),

    sectionHeading('2) Offer Details Below Mentioned'),
    labelValueTable(offerRows),

    ...itemParagraphs,

    ...(data.applyTyrePenalty
      ? [sectionHeading('Tyre Report'), buildTyreTable(data.tyres)]
      : []),

    ...(data.notes.trim()
      ? [new Paragraph({ spacing: { before: 200 } }), bodyParagraph(data.notes.trim())]
      : []),

    sectionHeading("Consultant Engineer's Comment"),
    ...(data.consultantComment.trim()
      ? [bodyParagraph(data.consultantComment.trim())]
      : [1, 2, 3].map(() => new Paragraph({
          spacing: { before: 360 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } },
        }))),

    sectionHeading('Signatures'),
    buildSignaturesTable(data.signatures),

    ...(data.showSavingDetails
      ? [new Paragraph({ spacing: { before: 300 } }), buildSavingDetailsBox(data)]
      : []),
  ]

  const doc = new Document({
    creator: 'MOFA Tool',
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
      headers: { default: buildWatermarkHeader() },
      children,
    }],
  })

  return Packer.toBlob(doc)
}

export async function buildDocxBlob(data: ReportData): Promise<Blob> {
  return buildDocx(data)
}

export async function downloadDocx(data: ReportData, filename = 'mofa.docx') {
  const blob = await buildDocx(data)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
