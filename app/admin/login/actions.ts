'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  // Authenticate user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Authentication failed' }
  }

  // Check admin role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (userError || !userData) {
    await supabase.auth.signOut()
    return { error: 'Unable to verify admin privileges' }
  }

  if (userData.role !== 'admin') {
    await supabase.auth.signOut()
    return { error: 'You do not have admin privileges' }
  }

  // Success - redirect will be handled by middleware
  redirect('/admin')
}
