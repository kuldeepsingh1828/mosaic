import Link from 'next/link'
import { LOCATIONS, LOCATION_LABELS } from '@/lib/locations'

export default function LocationPicker() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6f4] px-5 py-8 text-[#20252b]">
      <div className="w-full max-w-md">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="grid size-7 grid-cols-2 gap-0.5 rounded-md bg-[#20252b] p-1.5" aria-hidden="true">
            <span className="rounded-[1px] bg-[#e87963]" /><span className="rounded-[1px] bg-[#f2b66d]" /><span className="rounded-[1px] bg-[#76a9c9]" /><span className="rounded-[1px] bg-[#8eae8a]" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#687078]">Team activity</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">Create Together</h1>
        <p className="mt-2 text-sm text-[#687078]">Choose your location to join its canvas.</p>
        <ul className="mt-8 flex flex-col gap-3">
          {LOCATIONS.map((location) => (
            <li key={location}>
              <Link
                href={`/${location}`}
                className="flex h-14 items-center justify-between rounded-2xl border border-[#dfe3df] bg-white px-5 font-medium shadow-[0_4px_20px_rgba(32,37,43,0.04)] transition-colors hover:border-[#20252b]"
              >
                {LOCATION_LABELS[location]}
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
