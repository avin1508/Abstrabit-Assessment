import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Input from './Input.jsx'
import IconButton from './IconButton.jsx'

export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false)

  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      rightElement={
        <IconButton
          icon={visible ? EyeOff : Eye}
          label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          size="sm"
          tooltip={false}
          onClick={() => setVisible((value) => !value)}
        />
      }
    />
  )
}
