import { plainText } from '../../utils/chatText.js'

const FILE_TYPE_LABELS = { pdf: 'PDF', docx: 'DOCX', md: 'Markdown', txt: 'Text' }

export const fileTypeLabel = (type) => FILE_TYPE_LABELS[type] ?? type?.toUpperCase() ?? 'File'

export function claimsForCitation(text = '', index) {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .filter((sentence) => sentence.includes(`[${index}]`))
    .map((sentence) => plainText(sentence.replace(/^- /, '')))
    .filter(Boolean)
}
