export default function AuthFormHeader({ title, description }) {
  return (
    <div className="mb-7">
      <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
      {description && <p className="mt-1.5 text-sm text-fg-muted">{description}</p>}
    </div>
  )
}
