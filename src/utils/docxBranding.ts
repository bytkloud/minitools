import { AlignmentType, Footer, Packer, Paragraph, TextRun, type Document } from 'docx'
import JSZip from 'jszip'

const FOOTER_LINES = ['Pioneered by Kasun@R', 'Technical Contact - chaturajd@gmail.com']

export function brandingFooter() {
  return {
    default: new Footer({
      children: FOOTER_LINES.map(text => new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, font: 'Calibri', size: 16, color: '808080' })],
      })),
    }),
  }
}

// Locks the document read-only except for an editable range spanning the whole body,
// so the header/footer can't be changed without Review → Restrict Editing → Stop Protection.
export async function packDocx(doc: Document): Promise<Blob> {
  const zip = await JSZip.loadAsync(await Packer.toArrayBuffer(doc))

  const settingsPath = 'word/settings.xml'
  const settings = await zip.file(settingsPath)!.async('string')
  const protection = '<w:documentProtection w:edit="readOnly" w:enforcement="1"/>'
  zip.file(settingsPath, settings.includes('<w:displayBackgroundShape/>')
    ? settings.replace('<w:displayBackgroundShape/>', `<w:displayBackgroundShape/>${protection}`)
    : settings.replace(/(<w:settings[^>]*>)/, `$1${protection}`))

  const docPath = 'word/document.xml'
  const body = await zip.file(docPath)!.async('string')
  const lastSectPr = body.lastIndexOf('<w:sectPr')
  zip.file(docPath,
    body.slice(0, lastSectPr).replace('<w:body>', '<w:body><w:permStart w:id="0" w:edGrp="everyone"/>')
    + '<w:permEnd w:id="0"/>'
    + body.slice(lastSectPr))

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}
