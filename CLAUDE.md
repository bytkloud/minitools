# minitools

A Vite + React + TypeScript app hosting small insurance/engineering tools. No backend — everything runs in the browser.

## Stack

- **Vite 7** + React 19 + TypeScript
- **Tailwind v4** (via `@tailwindcss/vite` plugin)
- **react-router-dom v7** for routing
- Each tool lives in `src/tools/<tool-name>/` with its own CSS

## Adding a new tool

1. Create `src/tools/<name>/index.tsx` and `form.tsx` (+ `report.css` if needed)
2. Add a route in `src/App.tsx`
3. Add a card on `src/pages/Home.tsx`

## Adding DOCX export to a tool

The pattern used in `technical-investigation-report` — easy to replicate or swap for `docxtemplater` later.

### 1. Define the data shape

Create `report-types.ts` alongside the tool. This is the contract between the form and any document builder — if you ever switch to `docxtemplater`, only the builder changes.

```ts
// report-types.ts
export interface ReportData {
  field1: string
  field2: string
  // ...
}
```

### 2. Write the builder

Create `docx-builder.ts`. Export a single async function `downloadDocx(data: ReportData)`.

```ts
import { Document, Packer, Paragraph, TextRun, ... } from 'docx'
import type { ReportData } from './report-types'

export async function downloadDocx(data: ReportData, filename = 'report.docx') {
  const doc = new Document({ sections: [{ children: [...] }] })
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
```

**Key docx v9 APIs used:**

| Need | API |
|---|---|
| Section heading style | `Paragraph` with `shading`, `border.left`, `indent`, `keepNext: true` |
| Shaded table cell | `TableCell` with `shading: { type: ShadingType.CLEAR, fill: 'F5F5F5' }` |
| Image embed | `ImageRun` with `data: Uint8Array`, `type: 'jpg'\|'png'`, `transformation: { width, height }` (pixels) |
| Borderless table | `Table` + each `TableCell` with `borders: { top/bottom/left/right/insideH/insideV: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } }` |
| Page margins | `section.properties.page.margin` in twips (1 inch = 1440 twips) |
| Base64 → Uint8Array | `atob(dataUrl.split(',')[1])` → loop into `Uint8Array` |

**Design tokens** (from `technical-investigation-report/docx-builder.ts` — reuse for consistency):

```
Font:            Calibri
Body size:       22 half-pts (11pt)
Heading BG:      F0F0F0  border: 333333
Label cell BG:   F5F5F5
Cell border:     999999
Page margins:    top/right/bottom 1440, left 1800 (twips)
```

### 3. Make form state fully controlled

The form must expose all values via React state (no uncontrolled inputs) so `buildReportData()` can snapshot them on demand:

```tsx
const buildReportData = (): ReportData => ({ field1, field2, ... })
const handleDownloadDocx = () => downloadDocx(buildReportData())
```

### Switching to docxtemplater later

Replace `docx-builder.ts` with a `docxtemplater-builder.ts` that accepts the same `ReportData` type, fill a `.docx` template, and trigger the same blob download. The form import just changes from one to the other.

### Embedding full-resolution originals in DOCX (not yet implemented)

Currently `normalizeImage` resamples all uploads to ≤1920px JPEG before storing in React state. This keeps the form fast but means the DOCX contains compressed copies.

**Goal:** embed the original full-resolution image in the DOCX (visible in Word, right-click → Save as Picture recovers the original), while still showing a small preview in the form UI.

**Approach:**

1. Change photo state type from `string | null` → `File | null` in both form components.
2. Render preview in the form using `URL.createObjectURL(file)` + revoke on unmount/replace.
3. Add a `fileToDocxJpeg(file: File): Promise<Uint8Array>` utility (canvas at full dimensions, `toDataURL('image/jpeg', 0.92)` → `toUint8Array`) — format-converts without resizing.
4. Update `ReportData` photo fields from `string | null` → `File | null`.
5. Make `downloadDocx` async, call `fileToDocxJpeg` on each photo just before building `ImageRun`.

No new dependencies needed. The `transformation` in `ImageRun` controls display size; the embedded data stays full-res.

## Deploy

See `DEPLOY.md`.
