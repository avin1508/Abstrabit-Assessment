import useForm from '../../hooks/useForm.js'
import useToast from '../../hooks/useToast.js'
import useWorkspace from '../../hooks/useWorkspace.js'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import Modal from '../ui/Modal.jsx'

// Mirrors the backend rule (backend/src/validators/workspace.validator.js).
const NAME_MAX_LENGTH = 80

function validate({ name }) {
  if (!name.trim()) return { name: 'Enter a workspace name.' }
  if (name.trim().length > NAME_MAX_LENGTH) return { name: `Use at most ${NAME_MAX_LENGTH} characters.` }
  return {}
}

export default function CreateWorkspaceModal({ open, onClose }) {
  const { toast } = useToast()
  const { addWorkspace } = useWorkspace()

  const form = useForm({
    initialValues: { name: '' },
    validate,
    onSubmit: async ({ name }) => {
      try {
        const workspace = await addWorkspace(name.trim())
        toast({ tone: 'success', title: 'Workspace created', description: `Switched to ${workspace.name}.` })
        onClose()
      } catch (error) {
        toast({ tone: 'danger', title: 'Couldn’t create workspace', description: error.message })
      }
    },
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create workspace"
      description="Each workspace has its own documents, chats, tasks and tool history. Nothing is shared between workspaces."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={form.isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="create-workspace-form" loading={form.isSubmitting}>
            {form.isSubmitting ? 'Creating…' : 'Create workspace'}
          </Button>
        </>
      }
    >
      <form id="create-workspace-form" onSubmit={form.handleSubmit} noValidate>
        <Input label="Workspace name" placeholder="e.g. Marketing Team" autoFocus {...form.register('name')} />
      </form>
    </Modal>
  )
}
