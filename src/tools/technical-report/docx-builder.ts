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
import type { DamageData, ReportData, SignatureData } from './report-types'

// ─── Design tokens ────────────────────────────────────────────────────────────

const FONT = 'Calibri'
const C_TEXT = '1A1A1A'
const C_MUTED = '666666'
const C_HEADING_BG = 'F0F0F0'
const C_HEADING_BORDER = '333333'
const C_LABEL_BG = 'F5F5F5'
const C_BORDER = '999999'

// ─── Border presets ───────────────────────────────────────────────────────────

const B_NONE = { style: BorderStyle.NONE, size: 0, color: 'auto' } as const
const B_CELL = { style: BorderStyle.SINGLE, size: 4, color: C_BORDER } as const
const B_SIG  = { style: BorderStyle.SINGLE, size: 6, color: '000000' } as const

const BORDERS_NONE = { top: B_NONE, bottom: B_NONE, left: B_NONE, right: B_NONE, insideHorizontal: B_NONE, insideVertical: B_NONE }
const BORDERS_CELL = { top: B_CELL, bottom: B_CELL, left: B_CELL, right: B_CELL }
const BORDERS_SIG  = { top: B_NONE, bottom: B_SIG,  left: B_NONE, right: B_NONE }

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

function formatCurrency(raw: string): string {
  if (!raw) return '–'
  const num = Number(raw)
  if (isNaN(num)) return raw
  return 'LKR ' + new Intl.NumberFormat('en-LK').format(num)
}

// ─── Cell helpers ─────────────────────────────────────────────────────────────

function labelCell(text: string, widthPct = 35) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    borders: BORDERS_CELL,
    shading: { type: ShadingType.CLEAR, fill: C_LABEL_BG },
    children: [new Paragraph({
      children: [run(text, { bold: true, size: 20 })],
      spacing: { before: 60, after: 60 },
      indent: { left: 80 },
    })],
  })
}

function valueCell(text: string, widthPct = 65) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    borders: BORDERS_CELL,
    children: [new Paragraph({
      children: [run(text, { size: 20 })],
      spacing: { before: 60, after: 60 },
      indent: { left: 80 },
    })],
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

// ─── Block builders ───────────────────────────────────────────────────────────

function titleBlock() {
  return new Paragraph({
    children: [run('TOTAL LOSS REPORT', { bold: true, size: 32 })],
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

function buildVehicleTable(data: ReportData) {
  const rows: [string, string][] = [
    ['Vehicle No',   data.vehicleNo],
    ['MOI No',       data.moiNo],
    ['Chassis No',   data.chassisNo],
    ['Make / Model', data.makeModel],
    ['Y.O.M',        data.yom],
    ['Mileage',      data.mileage],
    ['Sum Insured',  formatCurrency(data.sumInsured)],
    ['PAV',          formatCurrency(data.pav)],
  ]
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([label, value]) =>
      new TableRow({ children: [labelCell(label), valueCell(value)] })
    ),
  })
}

function buildMarketValueTable(data: ReportData) {
  const rows: [string, string][] = [
    ['Current Market Values – In Web',                     formatCurrency(data.marketWebValue)],
    ['Confirmation by Valuation Officer (Channaka)',        formatCurrency(data.valuationOfficerValue)],
    ['Confirmation by Area Engineer (Physical Inspection)', formatCurrency(data.areaEngineerValue)],
    ['Confirmation by Zonal Engineer',                     formatCurrency(data.zonalEngineerValue)],
  ]
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [headerCell('Description', 65), headerCell('Value', 35)] }),
      ...rows.map(([label, value]) =>
        new TableRow({ children: [valueCell(label, 65), valueCell(value, 35)] })
      ),
    ],
  })
}

function buildSalvageTable(data: ReportData) {
  const rows: [string, string][] = [
    ['Salvage Value', formatCurrency(data.salvageValue)],
    ['Wreck Value',   formatCurrency(data.wreckValue)],
  ]
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([label, value]) =>
      new TableRow({ children: [labelCell(label, 40), valueCell(value, 60)] })
    ),
  })
}

function buildDamagePhotoGrid(photos: DamageData['photos']): Table {
  const pairs: [string | null, string | null][] = [
    [photos[0], photos[1]],
    [photos[2], photos[3]],
  ]
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDERS_NONE,
    rows: pairs.map(([a, b]) =>
      new TableRow({
        children: [a, b].map(src =>
          new TableCell({
            borders: BORDERS_NONE,
            margins: { top: 60, bottom: 60, left: 60, right: 60 },
            children: [new Paragraph({
              children: src
                ? [new ImageRun({
                    data: toUint8Array(src),
                    transformation: { width: 270, height: 195 },
                    type: imgType(src),
                  })]
                : [run(' ')],
              alignment: AlignmentType.CENTER,
            })],
          })
        ),
      })
    ),
  })
}

function buildDamageBlock(damage: DamageData, index: number): (Paragraph | Table)[] {
  const items: (Paragraph | Table)[] = [
    new Paragraph({
      children: [run(`${index + 1}.  ${damage.text}`, { size: 20 })],
      spacing: { before: 120, after: 80 },
    }),
  ]
  if (damage.photos.some(Boolean)) {
    items.push(buildDamagePhotoGrid(damage.photos))
  }
  return items
}

function buildTyreTable(tyres: ReportData['tyres']) {
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
        new TableRow({ children: [labelCell(label, 30), valueCell(value, 70)] })
      ),
    ],
  })
}

function buildSignaturesTable(sigs: ReportData['signatures']) {
  const entries: [string, SignatureData][] = [
    ['Area Engineer',          sigs.areaEngineer],
    ['Zonal Engineer',         sigs.zonalEngineer],
    ['Manager Motor Engineer', sigs.managerMotor],
  ]
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDERS_NONE,
    rows: [
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
      new TableRow({
        children: entries.map(([, sig]) =>
          new TableCell({
            borders: BORDERS_NONE,
            children: [new Paragraph({
              children: [run(`Date: ${sig.date}`, { size: 18, color: C_MUTED })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 80 },
            })],
          })
        ),
      }),
    ],
  })
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function downloadDocx(
  data: ReportData,
  filename = 'total-loss-report.docx',
) {
  const damageChildren = data.damages.flatMap((d, i) => buildDamageBlock(d, i))

  const doc = new Document({
    creator: 'Total Loss Report Tool',
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

        sectionHeading('Vehicle Details'),
        buildVehicleTable(data),

        sectionHeading('Market Value Confirmation'),
        buildMarketValueTable(data),

        sectionHeading('Technical Salvage'),
        buildSalvageTable(data),

        sectionHeading('Damages'),
        ...damageChildren,

        sectionHeading('Tyre Report'),
        buildTyreTable(data.tyres),

        sectionHeading('Conclusion'),
        ...data.conclusions.map(text => new Paragraph({
          children: [run(text, { size: 20 })],
          bullet: { level: 0 },
          spacing: { line: 360, after: 80 },
        })),
        ...(data.conclusions.length > 0 ? [bodyParagraph('Therefore, considering all technical circumstances, my technical opinion is to treat this claim on a total loss basis.')] : []),

        sectionHeading('Signatures'),
        buildSignaturesTable(data.signatures),
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
