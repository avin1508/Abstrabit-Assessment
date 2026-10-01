import { useState } from 'react'

export default function useForm({ initialValues, validate, onSubmit }) {
  const [values, setValues] = useState(initialValues)
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const errors = validate(values)

  function handleChange(event) {
    const { name, type, value, checked } = event.target
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setSubmitError(null)
  }

  function handleBlur(event) {
    const { name, value } = event.target
    if (value) setTouched((current) => ({ ...current, [name]: true }))
  }

  function register(name) {
    const isCheckbox = typeof initialValues[name] === 'boolean'
    return {
      name,
      onChange: handleChange,
      ...(isCheckbox
        ? { checked: values[name] }
        : { value: values[name], onBlur: handleBlur, error: submitted || touched[name] ? errors[name] : undefined }),
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)

    const firstInvalid = Object.keys(errors)[0]
    if (firstInvalid) {
      event.currentTarget.elements.namedItem(firstInvalid)?.focus()
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit(values)
    } catch (error) {
      setSubmitError(error?.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return { values, setValues, errors, register, handleSubmit, isSubmitting, submitError }
}
