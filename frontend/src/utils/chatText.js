// Strips answer formatting (bold, code, [n] markers, bullets) to plain text for previews and copying.
export function plainText(text = '') {
  return text
    .replace(/\*\*|`/g, '')
    .replace(/\s*\[\d+\]/g, '')
    .replace(/\n+- /g, '; ')
    .replace(/\s*\n+\s*/g, ' ')
    .trim()
}
