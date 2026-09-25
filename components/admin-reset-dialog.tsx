'use client'

import { useEffect, useRef } from 'react'

type AdminResetDialogProps = {
  location: string
  error?: 'password' | 'server'
}

export function AdminResetDialog({ location, error }: AdminResetDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (error) dialogRef.current?.showModal()
  }, [error])

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} className="h-10 rounded-lg border border-[#c96b59] px-4 text-sm font-medium text-[#a04e3c] hover:bg-[#fdf0ed] focus:outline-none focus:ring-2 focus:ring-[#c96b59]/30">
        Reset Activity
      </button>
      <dialog ref={dialogRef} className="m-auto w-[min(90vw,420px)] rounded-2xl border border-[#dfe3df] bg-white p-0 text-[#20252b] shadow-2xl backdrop:bg-[#20252b]/40">
        <form action="/api/admin/reset" method="post" className="p-6">
          <input type="hidden" name="location" value={location} />
          <h3 className="text-lg font-semibold">Reset Activity</h3>
          <p className="mt-2 text-sm text-[#687078]">This clears every colored cell and returns the activity to its configured starting grid.</p>
          {error ? <p className="mt-4 rounded-lg bg-[#fdf0ed] px-3 py-2 text-sm text-[#a04e3c]" role="alert">{error === 'password' ? 'Incorrect admin password.' : 'The activity could not be reset.'}</p> : null}
          <label className="mt-5 flex flex-col gap-2 text-sm font-medium">Confirm admin password<input name="password" type="password" required autoComplete="current-password" className="h-10 rounded-lg border border-[#dfe3df] px-3 outline-none focus:border-[#20252b] focus:ring-2 focus:ring-[#20252b]/15" /></label>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => dialogRef.current?.close()} className="h-10 rounded-lg px-4 text-sm font-medium text-[#687078] hover:bg-[#f1f3f1] focus:outline-none focus:ring-2 focus:ring-[#20252b]/15">Cancel</button>
            <button type="submit" className="h-10 rounded-lg bg-[#a04e3c] px-4 text-sm font-medium text-white hover:bg-[#894130] focus:outline-none focus:ring-2 focus:ring-[#a04e3c]/30">Confirm Reset</button>
          </div>
        </form>
      </dialog>
    </>
  )
}
