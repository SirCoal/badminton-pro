import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/login/actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    redirect('/login')
  }

  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>
      <p className="mb-6">Logged in as: {data.user.email}</p>

      <form action={signOut}>
        <button className="rounded-lg bg-red-600 px-4 py-2 text-white">
          Sign out
        </button>
      </form>
    </main>
  )
}