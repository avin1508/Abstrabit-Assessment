import { plainText } from '../../utils/chatText.js'

// Display helpers for citation objects ({ index, workspaceId, documentId, documentName, type, location, excerpt }).

const FILE_TYPE_LABELS = { pdf: 'PDF', docx: 'DOCX', md: 'Markdown', txt: 'Text' }

export const fileTypeLabel = (type) => FILE_TYPE_LABELS[type] ?? type?.toUpperCase() ?? 'File'

// Sentences of an answer that cite source `index` — the claims this source supports.
export function claimsForCitation(text = '', index) {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .filter((sentence) => sentence.includes(`[${index}]`))
    .map((sentence) => plainText(sentence.replace(/^- /, '')))
    .filter(Boolean)
}
