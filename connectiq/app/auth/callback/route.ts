import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Defined" : "Undefined");
    console.log("Supabase Anon Key Length:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0);

    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } else {
        console.error('Supabase Auth Error:', error)
    }
  } else {
      console.error('No code found in search params')
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?message=Could not login with provider`)
}
