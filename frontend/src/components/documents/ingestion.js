export const STAGE_LABELS = {
  extracting: 'Extracting text',
  chunking: 'Chunking',
  embedding: 'Embedding',
}

const STEPS = [
  { id: 'uploaded', label: 'Uploaded', description: 'File received and stored' },
  { id: 'validating', label: 'Validated', description: 'Type and size checked' },
  { id: 'extracting', label: 'Text extracted', description: 'Plain text pulled from the file' },
  { id: 'chunking', label: 'Chunked', description: 'Split into overlapping passages' },
  { id: 'embedding', label: 'Embedded', description: 'Vector embeddings generated per chunk' },
  { id: 'indexed', label: 'Indexed', description: 'Searchable in this workspace' },
]

export function getPipelineSteps(document) {
  const index = (id) => STEPS.findIndex((step) => step.id === id)

  let activeIndex
  let activeState
  switch (document.status) {
    case 'indexed':
      activeIndex = STEPS.length
      break
    case 'processing':
      activeIndex = index(document.stage)
      activeState = 'current'
      break
    case 'failed':
      activeIndex = index(document.failedStage ?? 'extracting')
      activeState = 'failed'
      break
    default:
      activeIndex = 0
      activeState = 'pending'
  }

  return STEPS.map((step, i) => ({
    ...step,
    state: i < activeIndex ? 'done' : i === activeIndex ? activeState : 'pending',
  }))
}
