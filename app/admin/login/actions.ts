'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/admin/login?error=missing_credentials')
  }

  const supabase = await createClient()

  // Authenticate user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    redirect('/admin/login?error=' + encodeURIComponent(authError.message))
  }

  if (!authData.user) {
    redirect('/admin/login?error=authentication_failed')
  }

  // Check admin role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (userError || !userData) {
    await supabase.auth.signOut()
    redirect('/admin/login?error=unable_to_verify')
  }

  if (userData.role !== 'admin') {
    await supabase.auth.signOut()
    redirect('/admin/login?error=not_admin')
  }

  // Success - redirect will be handled by middleware
  redirect('/admin')
}
