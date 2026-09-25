import Link from 'next/link'

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6f4] px-5 py-8 text-[#20252b]">
      <section className="w-full max-w-md rounded-2xl border border-[#dfe3df] bg-white p-7 shadow-[0_4px_20px_rgba(32,37,43,0.04)]">
        <Link href="/" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#687078]">Mosaic</Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-[-0.04em]">Admin login</h1>
        <p className="mt-2 text-sm text-[#687078]">Configure the team activity from here.</p>
        {params.error ? <p className="mt-5 rounded-lg bg-[#fdf0ed] px-3 py-2 text-sm text-[#a04e3c]" role="alert">Invalid username or password.</p> : null}
        <form action="/api/admin/login" method="post" className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium">Username<input name="username" required autoComplete="username" className="h-10 rounded-lg border border-[#dfe3df] px-3 outline-none focus:border-[#20252b] focus:ring-2 focus:ring-[#20252b]/15" /></label>
          <label className="flex flex-col gap-2 text-sm font-medium">Password<input name="password" required type="password" autoComplete="current-password" className="h-10 rounded-lg border border-[#dfe3df] px-3 outline-none focus:border-[#20252b] focus:ring-2 focus:ring-[#20252b]/15" /></label>
          <button type="submit" className="mt-2 h-10 rounded-lg bg-[#20252b] px-4 text-sm font-medium text-white transition-colors hover:bg-[#3c444b] focus:outline-none focus:ring-2 focus:ring-[#20252b]/30">Sign in</button>
        </form>
      </section>
    </main>
  )
}
