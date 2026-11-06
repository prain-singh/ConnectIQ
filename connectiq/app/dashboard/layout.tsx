'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Users, MessageSquareText, Settings, LogOut, Menu, X, Code2, User, Sparkles, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: MessageSquareText, label: 'Interview', href: '/dashboard/interview' },
  { icon: Code2, label: 'Tech Round', href: '/dashboard/coding' },
  { icon: Users, label: 'Community', href: '/dashboard/community' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || 'User')
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')
      }
    }
    fetchUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      {/* Global ambient background glow */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/6 rounded-full blur-[150px]" />
      </div>

      {/* Sidebar - Desktop */}
      <motion.aside
        initial={{ width: 280 }}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex flex-col h-full relative z-20 bg-card/30 backdrop-blur-2xl border-r border-border/40"
      >
        {/* Sidebar inner glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent" />
        </div>

        {/* Logo Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-border/30 relative">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div
                key="logo-full"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/25">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                  ConnectIQ
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="logo-icon"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/25 mx-auto"
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl hover:bg-secondary/50 transition-all duration-200 active:scale-90"
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4 text-muted-foreground" /> : <Menu className="w-4 h-4 text-muted-foreground" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          {sidebarItems.map((item, index) => {
            const isActive = pathname === item.href
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-3.5 rounded-2xl transition-all duration-200 group relative overflow-hidden ${
                    isActive 
                      ? 'text-primary font-semibold' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {/* Active background glow */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-2xl"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  {/* Hover background */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-secondary/0 group-hover:bg-secondary/40 rounded-2xl transition-colors duration-200" />
                  )}
                  <item.icon className={`w-5 h-5 relative z-10 flex-shrink-0 ${isSidebarOpen ? 'mr-4' : 'mx-auto'} ${isActive ? 'text-primary' : 'group-hover:text-foreground'}`} />
                  {isSidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="relative z-10 whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                  {isActive && isSidebarOpen && (
                    <motion.div 
                      layoutId="active-dot"
                      className="w-2 h-2 rounded-full bg-primary ml-auto relative z-10 shadow-[0_0_8px_rgba(139,92,246,0.6)]" 
                    />
                  )}
                </Link>
              </motion.div>
            )
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-border/30 space-y-3">
          {userEmail && (
            <div className={`flex items-center px-4 py-3 rounded-2xl bg-gradient-to-r from-secondary/40 to-secondary/20 border border-border/30 overflow-hidden ${!isSidebarOpen && 'justify-center'}`}>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center flex-shrink-0 border border-primary/20 ${isSidebarOpen ? 'mr-3' : ''}`}>
                <User className="w-4 h-4 text-primary" />
              </div>
              {isSidebarOpen && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleSignOut}
            className={`flex items-center w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all duration-200 group ${!isSidebarOpen && 'justify-center'}`}
          >
            <LogOut className={`w-5 h-5 flex-shrink-0 group-hover:translate-x-[-2px] transition-transform ${isSidebarOpen ? 'mr-3' : ''}`} />
            {isSidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Mobile Header */}
        <div className="md:hidden h-16 flex items-center justify-between px-6 border-b border-border/40 bg-card/30 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">ConnectIQ</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-xl hover:bg-secondary/50">
            <Menu className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
