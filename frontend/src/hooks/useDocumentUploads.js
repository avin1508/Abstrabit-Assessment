import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { uploadDocument } from '../store/slices/documentSlice.js'
import { getFileExtension, validateUploadFile } from '../utils/fileValidation.js'

const CLEAR_DONE_AFTER_MS = 4000

export default function useDocumentUploads({ workspaceId, onUploaded }) {
  const dispatch = useDispatch()
  const uploadProgress = useSelector((state) => state.document.uploadProgress)
  const [uploads, setUploads] = useState([])
  const nextId = useRef(0)
  const queue = useRef([])
  const running = useRef(false)
  // Ref so an upload loop started earlier always calls the latest callback.
  const onUploadedRef = useRef(onUploaded)
  useEffect(() => {
    onUploadedRef.current = onUploaded
  })

  // Files still waiting when the page unmounts (e.g. workspace switch) are not uploaded.
  useEffect(() => () => (queue.current = []), [])

  const update = (id, patch) =>
    setUploads((current) => current.map((upload) => (upload.id === id ? { ...upload, ...patch } : upload)))

  const dismiss = (id) => setUploads((current) => current.filter((upload) => upload.id !== id))

  const clearFinished = () =>
    setUploads((current) => current.filter((upload) => upload.status === 'uploading' || upload.status === 'queued'))

  async function drain() {
    if (running.current) return
    running.current = true
    while (queue.current.length) {
      const { id, file } = queue.current.shift()
      update(id, { status: 'uploading' })
      try {
        // workspaceId is fixed when the file is added, so a later switch can't redirect it.
        const document = await dispatch(uploadDocument({ workspaceId, file })).unwrap()
        update(id, { status: 'done' })
        onUploadedRef.current?.(document)
        setTimeout(() => dismiss(id), CLEAR_DONE_AFTER_MS)
      } catch (error) {
        update(id, { status: 'error', error: error.message })
      }
    }
    running.current = false
  }

  function addFiles(fileList) {
    const entries = [...fileList].map((file) => {
      const error = validateUploadFile(file)
      const entry = {
        id: ++nextId.current,
        name: file.name,
        size: file.size,
        type: getFileExtension(file.name),
        status: error ? 'rejected' : 'queued',
        error,
      }
      if (!error) queue.current.push({ id: entry.id, file })
      return entry
    })

    setUploads((current) => [...entries, ...current])
    drain()
    return entries
  }

  const visible = uploads.map((upload) => (upload.status === 'uploading' ? { ...upload, progress: uploadProgress } : upload))

  return { uploads: visible, addFiles, dismiss, clearFinished }
}
