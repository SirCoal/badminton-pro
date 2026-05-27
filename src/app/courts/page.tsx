'use client'
// app/courts/page.tsx  (or app/page.tsx — wherever your listing lives)
// Replaces your existing page.tsx — same Supabase + Google logic, cards now link to courts/[id]

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LoadScript, Autocomplete } from '@react-google-maps/api'

const libraries: ("places")[] = ["places"]

type Court = {
  id: string
  name: string
  location: string | null
  price_per_hour: number | null
  image_url: string | null
}

export default function CourtsPage() {
  const supabase = createClient()

  const [courts, setCourts] = useState<Court[]>([])
  const [search, setSearch] = useState('')
  const [autocomplete, setAutocomplete] = useState<any>(null)
  const [minPrice, setMinPrice] = useState<number | ''>('')
  const [maxPrice, setMaxPrice] = useState<number | ''>('')

  useEffect(() => { fetchCourts() }, [])

  async function fetchCourts() {
    let query = supabase.from('courts').select('id, name, location, price_per_hour, image_url')
    if (search)            query = query.ilike('location', `%${search}%`)
    if (minPrice !== '')   query = query.gte('price_per_hour', minPrice)
    if (maxPrice !== '')   query = query.lte('price_per_hour', maxPrice)
    const { data } = await query
    if (data) setCourts(data)
  }

  function onPlaceChanged() {
    if (autocomplete) {
      const place = autocomplete.getPlace()
      setSearch(place.formatted_address || place.name || '')
    }
  }

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      libraries={libraries}
    >
      <main className="mx-auto max-w-7xl p-6">
        <h1 className="mb-6 text-3xl font-bold">Courts</h1>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <Autocomplete onLoad={(a) => setAutocomplete(a)} onPlaceChanged={onPlaceChanged}>
            <input type="text" placeholder="Search location..."
              className="w-full rounded-lg border p-3" />
          </Autocomplete>
          <input type="number" placeholder="Min price" value={minPrice}
            onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
            className="w-full rounded-lg border p-3" />
          <input type="number" placeholder="Max price" value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
            className="w-full rounded-lg border p-3" />
          <button onClick={fetchCourts}
            className="rounded-lg bg-black px-4 py-3 text-white">Apply</button>
        </div>

        {/* Court cards — each links to /courts/[id] */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courts.map((court) => (
            <Link key={court.id} href={`/courts/${court.id}`}
              className="group rounded-xl border shadow hover:shadow-md transition-shadow overflow-hidden block">
              <div className="relative h-48 w-full bg-gray-100">
                <Image
                  src={court.image_url || '/court-placeholder.jpg'}
                  alt={court.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h2 className="text-lg font-bold">{court.name}</h2>
                <p className="text-gray-500 text-sm mt-1">{court.location}</p>
                <p className="font-semibold text-green-600 mt-2">
                  ${court.price_per_hour}/hour
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </LoadScript>
  )
}
