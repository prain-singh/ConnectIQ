'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Brain, Video, ShieldCheck, Code, Sparkles, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function Home() {
  const router = useRouter()
  const supabase = createClient()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard')
      } else {
        setIsChecking(false)
      }
    })

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

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navbar Placeholder */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            ConnectIQ
          </div>
          <div className="hidden md:flex space-x-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-primary transition-colors">How it Works</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Login</Link>
            <Link href="/signup" className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-60 animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-[-10%] right-[-5%] w-[800px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] opacity-40" />
          <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-purple-500/15 rounded-full blur-[100px] opacity-40" />
        </div>
        
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-sm font-medium mb-4"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            <span>AI-Powered Interview Intelligence</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-tight"
          >
            Master Your Interview. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
              Secure Your Future.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Enhance your career readiness with real-time AI feedback, multimodal behavioral analysis, and bias-free technical assessments.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6"
          >
            <Link href="/dashboard" className="px-8 py-4 rounded-full bg-gradient-to-r from-primary to-purple-500 text-white text-lg font-bold hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-all flex items-center group transform hover:scale-105 active:scale-95">
              Start Mock Interview
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="#demo" className="px-8 py-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-foreground text-lg font-semibold hover:bg-white/10 hover:border-white/30 transition-all transform hover:scale-105">
              Watch Demo
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Why Choose ConnectIQ?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Our platform goes beyond standard Q&A. We analyze the *way* you speak, your confidence, and your technical prowess in real-time.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Brain className="w-8 h-8 text-primary" />}
              title="Adaptive AI Engine"
              description="Questions that evolve based on your responses, challenging you at just the right level."
            />
            <FeatureCard 
              icon={<Video className="w-8 h-8 text-pink-500" />}
              title="Multimodal Analysis"
              description="Real-time feedback on eye contact, posture, tone, and emotional cues."
            />
            <FeatureCard 
              icon={<Code className="w-8 h-8 text-blue-500" />}
              title="Collab Coding"
              description="Live coding environment with an AI pair programmer to test logic, not just syntax."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-green-500" />}
              title="Secure Proctoring"
              description="Anti-cheating measures ensuring integrity for certifications and hiring."
            />
             <FeatureCard 
              icon={<Zap className="w-8 h-8 text-yellow-500" />}
              title="Instant Feedback"
              description="Receive detailed reports immediately after your session with actionable insights."
            />
            <FeatureCard 
              icon={<Sparkles className="w-8 h-8 text-purple-500" />}
              title="Blind Audit Mode"
              description="Bias-free interviews masking voice and visuals for pure skill evaluation."
            />
          </div>
        </div>
      </section>
      
      {/* Footer Placeholder for simplicity */}
      <footer className="py-12 border-t border-white/10 text-center text-muted-foreground">
        © 2026 ConnectIQ. All rights reserved.
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="p-8 rounded-3xl bg-card/40 border border-border/50 backdrop-blur-xl hover:border-primary/50 transition-all duration-300 relative overflow-hidden group shadow-lg"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="mb-6 p-4 bg-background/50 rounded-2xl inline-block border border-border/50 shadow-inner relative z-10">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 relative z-10">{title}</h3>
      <p className="text-muted-foreground leading-relaxed relative z-10">
        {description}
      </p>
    </motion.div>
  )
}
