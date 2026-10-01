import RelativeTime from '../common/RelativeTime.jsx'
import Avatar from '../ui/Avatar.jsx'

export default function UserMessage({ message }) {
  return (
    <div className="flex justify-end gap-3">
      <div className="flex max-w-[88%] min-w-0 flex-col items-end sm:max-w-[75%]">
        <div className="mb-1 flex items-center gap-2 text-xs text-fg-subtle">
          <RelativeTime value={message.createdAt} />
          <span className="font-medium text-fg-muted">{message.author ?? 'You'}</span>
        </div>
        <div className="rounded-lg rounded-tr-sm bg-fg px-3.5 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap text-white">
          {message.text}
        </div>
      </div>
      <span className="mt-5 hidden sm:block">
        <Avatar name={message.author ?? 'You'} size="sm" />
      </span>
    </div>
  )
}
