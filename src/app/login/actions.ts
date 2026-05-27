'use server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signUp(formData: FormData): Promise<void> {
  const email = String(formData.get('email') || '')
  const password = String(formData.get('password') || '')
  const supabase = await createClient()
  const origin = (await headers()).get('origin') || 'http://localhost:3000'
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }
  redirect('/login?message=Check your email to confirm your account.')
}

export async function signIn(formData: FormData): Promise<void> {
  const email = String(formData.get('email') || '')
  const password = String(formData.get('password') || '')
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }
  redirect('/dashboard')
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient()
  const origin = (await headers()).get('origin') || 'http://localhost:3000'
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }