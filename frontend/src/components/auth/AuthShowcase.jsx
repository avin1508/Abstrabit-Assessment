import { FileText } from 'lucide-react'
import { cn } from '../../utils/cn.js'
import { LogoMark } from '../common/Logo.jsx'
import { TAGLINE } from './authCopy.js'

const PREVIEW_SOURCES = ['Refund Policy v4.pdf', 'Enterprise MSA.md']

function Marker({ children }) {
  return (
    <span className="mx-0.5 inline-flex h-4 min-w-4 -translate-y-px items-center justify-center rounded bg-brand-400/15 px-1 align-middle font-mono text-[10px] font-semibold text-brand-300 ring-1 ring-brand-400/25 ring-inset">
      {children}
    </span>
  )
}

export default function AuthShowcase({ className }) {
  return (
    <aside className={cn('relative flex-col overflow-hidden bg-fg p-12 text-white', className)}>
      <div className="absolute inset-0 bg-grid opacity-[0.07]" aria-hidden />
      <div className="absolute -top-40 -right-40 size-[36rem] rounded-full bg-brand-600/25 blur-3xl" aria-hidden />

      <div className="relative flex flex-1 flex-col justify-center gap-12">
        <div className="max-w-md">
          <p className="font-mono text-[11px] font-medium tracking-widest text-brand-300 uppercase">
            AI document assistant
          </p>
          <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-tight text-balance">{TAGLINE}</h2>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Every workspace is searched in isolation, every answer shows its sources, and when the documents don’t
            say, Abstrabit tells you.
          </p>
        </div>

        <div className="max-w-md rounded-xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-sm">
          <div className="flex justify-end">
            <p className="rounded-lg rounded-br-sm bg-white/10 px-3 py-2 text-[13px] text-white/90">
              What’s our refund window for enterprise plans?
            </p>
          </div>
          <div className="mt-4 flex gap-3">
            <LogoMark size="sm" className="bg-white/10" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] leading-relaxed text-white/80">
                Enterprise customers can request a full refund within <span className="text-white">60 days</span>
                <Marker>1</Marker>, after which credits are prorated <Marker>2</Marker>.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {PREVIEW_SOURCES.map((name, i) => (
                  <div
                    key={name}
                    className="flex min-w-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5"
                  >
                    <span className="font-mono text-[10px] text-white/50">{i + 1}</span>
                    <FileText className="size-3 shrink-0 text-white/40" aria-hidden />
                    <span className="truncate text-[11px] text-white/70">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="relative font-mono text-[11px] text-white/40">
        Workspace isolation · Source citations · Audited tool calls
      </p>
    </aside>
  )
}
