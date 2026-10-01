import { FileText, MessageSquare, Wrench } from 'lucide-react'
import StatCard, { StatCardSkeleton } from '../common/StatCard.jsx'

const GRID = 'grid grid-cols-1 gap-3 sm:grid-cols-3'

export default function OverviewStats({ stats, loading }) {
  if (loading) {
    return (
      <div className={GRID} aria-hidden>
        {Array.from({ length: 3 }, (_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <section aria-label="Workspace statistics" className={GRID}>
      <StatCard
        label="Documents"
        icon={FileText}
        value={stats.documents}
        footnote={
          stats.documents
            ? `${stats.indexedDocuments} indexed${stats.processingDocuments ? ` · ${stats.processingDocuments} processing` : ''}`
            : 'No documents yet'
        }
      />
      <StatCard
        label="Conversations"
        icon={MessageSquare}
        value={stats.conversations}
        footnote={stats.conversations ? 'Chat history in this workspace' : 'No conversations yet'}
      />
      <StatCard
        label="Tool calls"
        icon={Wrench}
        value={stats.toolCalls}
        footnote={
          stats.toolCalls
            ? `${stats.successfulToolCalls} succeeded · ${stats.unsuccessfulToolCalls} failed or blocked`
            : 'No tool activity yet'
        }
        footnoteTone={stats.unsuccessfulToolCalls ? 'warning' : 'neutral'}
      />
    </section>
  )
}
