export function plainText(text = '') {
  return text
    .replace(/\*\*|`/g, '')
    .replace(/\s*\[\d+\]/g, '')
    .replace(/\n+- /g, '; ')
    .replace(/\s*\n+\s*/g, ' ')
    .trim()
}
