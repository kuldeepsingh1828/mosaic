import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AdminResetDialog } from '@/components/admin-reset-dialog'
import { getAdminSession } from '@/lib/admin-auth'
import { LOCATIONS, LOCATION_LABELS, isLocation } from '@/lib/locations'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; resetError?: string; location?: string }>
}) {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  const params = await searchParams
  const highlightedLocation = isLocation(params.location) ? params.location : null

  return (
    <main className="min-h-screen bg-[#f5f6f4] px-5 py-8 text-[#20252b] sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-2xl">
        <header className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#687078]">Mosaic admin</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Activity settings</h1></div>
          <form action="/api/admin/logout" method="post"><button type="submit" className="text-sm font-medium text-[#687078] underline-offset-4 hover:text-[#20252b] hover:underline">Sign out</button></form>
        </header>

        {LOCATIONS.map((location) => {
          const isHighlighted = highlightedLocation === location

          return (
            <div key={location} className="mt-8">
              <h2 className="text-lg font-semibold">{LOCATION_LABELS[location]}</h2>

              <section className="mt-3 rounded-2xl border border-[#ead3ce] bg-white p-6 shadow-[0_4px_20px_rgba(32,37,43,0.04)]">
                <h3 className="text-sm font-semibold">Reset Activity</h3>
                <p className="mt-1 text-sm text-[#687078]">Clear the canvas and return this activity to READY using its configured starting grid.</p>
                {isHighlighted && params.reset ? <p className="mt-4 rounded-lg bg-[#edf6ed] px-3 py-2 text-sm text-[#4f7650]" role="status">Activity reset successfully.</p> : null}
                <div className="mt-5">
                  <AdminResetDialog
                    location={location}
                    error={isHighlighted ? (params.resetError === 'password' ? 'password' : params.resetError ? 'server' : undefined) : undefined}
                  />
                </div>
              </section>
            </div>
          )
        })}

        <Link href="/" className="mt-6 inline-block text-sm text-[#687078] hover:text-[#20252b]">← View employee activity</Link>
      </div>
    </main>
  )
}
