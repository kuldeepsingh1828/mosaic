import { notFound } from 'next/navigation'
import { ActivityCanvas } from '@/components/activity-canvas'
import { isLocation } from '@/lib/locations'

export default async function LocationPage({ params }: { params: Promise<{ location: string }> }) {
  const { location } = await params
  if (!isLocation(location)) notFound()

  return <ActivityCanvas location={location} />
}
