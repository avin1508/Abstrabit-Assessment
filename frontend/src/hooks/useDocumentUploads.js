import { useRef, useState } from 'react'
import { uploadDocument } from '../services/documentService.js'
import { getFileExtension, validateUploadFile } from '../utils/fileValidation.js'

const CLEAR_DONE_AFTER_MS = 4000

/*
 * Client-side upload queue.
 * Each entry: { id, name, size, type, status: uploading | done | rejected | error, progress, error }
 * Invalid files are rejected immediately; valid ones upload in parallel and call onUploaded(document).
 */
export default function useDocumentUploads({ workspaceId, uploadedBy, onUploaded }) {
  const [uploads, setUploads] = useState([])
  const nextId = useRef(0)

  const update = (id, patch) =>
    setUploads((current) => current.map((upload) => (upload.id === id ? { ...upload, ...patch } : upload)))

  const dismiss = (id) => setUploads((current) => current.filter((upload) => upload.id !== id))

  const clearFinished = () => setUploads((current) => current.filter((upload) => upload.status === 'uploading'))

  function addFiles(fileList) {
    const entries = [...fileList].map((file) => {
      const error = validateUploadFile(file)
      return {
        file,
        entry: {
          id: ++nextId.current,
          name: file.name,
          size: file.size,
          type: getFileExtension(file.name),
          status: error ? 'rejected' : 'uploading',
          progress: 0,
          error,
        },
      }
    })

    setUploads((current) => [...entries.map(({ entry }) => entry), ...current])

    for (const { file, entry } of entries) {
      if (entry.status !== 'uploading') continue
      uploadDocument(workspaceId, file, { uploadedBy, onProgress: (progress) => update(entry.id, { progress }) })
        .then((document) => {
          update(entry.id, { status: 'done', progress: 100 })
          onUploaded?.(document)
          setTimeout(() => dismiss(entry.id), CLEAR_DONE_AFTER_MS)
        })
        .catch((error) => update(entry.id, { status: 'error', error: error.message }))
    }

    return entries.map(({ entry }) => entry)
  }

  return { uploads, addFiles, dismiss, clearFinished }
}
