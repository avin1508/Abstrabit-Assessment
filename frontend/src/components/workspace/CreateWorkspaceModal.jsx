import useForm from '../../hooks/useForm.js'
import useToast from '../../hooks/useToast.js'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import Modal from '../ui/Modal.jsx'
import Textarea from '../ui/Textarea.jsx'

function validate({ name }) {
  return name.trim().length < 2 ? { name: 'Enter a workspace name (at least 2 characters).' } : {}
}

// UI only: creation is not wired up until the workspace API exists.
export default function CreateWorkspaceModal({ open, onClose }) {
  const { toast } = useToast()
  const form = useForm({
    initialValues: { name: '', description: '' },
    validate,
    onSubmit: async () => {
      onClose()
      toast({
        tone: 'info',
        title: 'Workspace creation isn’t connected yet',
        description: 'This will create the workspace once the backend is available.',
      })
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
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="create-workspace-form">
            Create workspace
          </Button>
        </>
      }
    >
      <form id="create-workspace-form" onSubmit={form.handleSubmit} noValidate className="space-y-4">
        <Input label="Workspace name" placeholder="e.g. Marketing Team" autoFocus {...form.register('name')} />
        <Textarea
          label="Description"
          hint="Optional. Helps teammates understand what belongs here."
          rows={3}
          {...form.register('description')}
        />
      </form>
    </Modal>
  )
}
