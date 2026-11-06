'use client'

import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { Chrome, Sparkles, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard')
      }
    })

    // Listen for auth events (like successful OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.push('/dashboard')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const handleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
    if (error) {
      console.error('Error logging in:', error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Multi-layered ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/15 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] left-[-10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
        className="w-full max-w-md p-10 rounded-3xl bg-card/40 backdrop-blur-2xl border border-border/40 shadow-2xl relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/25">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            ConnectIQ
          </span>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-sm">Sign in to continue your interview journey.</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl border border-border/40 bg-secondary/30 hover:bg-secondary/50 backdrop-blur-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group hover:border-primary/30 active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span className="font-semibold text-sm">Continue with Google</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all ml-auto" />
          </button>
        </div>

        <div className="mt-10 text-center">
          <p className="text-xs text-muted-foreground/60">
            By continuing, you agree to our{' '}
            <span className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">Terms of Service</span>
            {' '}and{' '}
            <span className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>.
          </p>
        </div>
      </motion.div>
      
      {/* Back to home link */}
      <Link href="/" className="absolute bottom-8 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 z-10">
        ← Back to home
      </Link>
    </div>
  )
}
