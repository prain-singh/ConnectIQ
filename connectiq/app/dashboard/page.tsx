'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BarChart2, 
  MessageCircle, 
  Code2, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  PlayCircle,
  Activity,
  X,
  FileText,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Flame,
  Target,
  ChevronRight
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts'

interface UserStats {
  interviewsCompleted: number
  avgWpm: number
  hoursPracticed: number
  totalFillers: number
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.3 } }
}

const StatCard = ({ title, icon, value, subtext, gradient, delay }: any) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -4, scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 300 }}
    className="relative overflow-hidden rounded-3xl p-6 bg-card/40 backdrop-blur-xl border border-border/40 group cursor-default shadow-lg"
  >
    {/* Animated gradient bg on hover */}
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.15em]">{title}</h3>
        <div className="p-2.5 rounded-2xl bg-background/40 border border-border/30 shadow-inner">
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-4xl font-bold tracking-tight">{value}</span>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-xs font-medium text-emerald-400">{subtext}</span>
      </div>
    </div>
  </motion.div>
)

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<UserStats>({
    interviewsCompleted: 0,
    avgWpm: 0,
    hoursPracticed: 0,
    totalFillers: 0,
  })
  const [recentInterviews, setRecentInterviews] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState<any | null>(null)
  const [userName, setUserName] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
         setLoading(false)
         return
      }

      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'there')

      // Fetch recent sessions
      const { data: sessions, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (sessions && !error) {
        const total = sessions.length
        
        // Calculate Total Hours Used
        const totalSeconds = sessions.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0)
        const hours = parseFloat((totalSeconds / 3600).toFixed(1))

        // Calculate Average WPM
        const averageWpm = total > 0 
           ? Math.round(sessions.reduce((acc, curr) => acc + (curr.average_wpm || 0), 0) / total) 
           : 0

        const totalFillers = sessions.reduce((acc, curr) => acc + (curr.total_filler_words || 0), 0)

        setStats({
          interviewsCompleted: total,
          avgWpm: averageWpm,
          hoursPracticed: hours,
          totalFillers,
        })

        setRecentInterviews(sessions.slice(0, 5))
      }
      setLoading(false)
    }
    
    checkAuthAndFetchData()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
    </div>
  )

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <>
      {/* Report Modal */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSession(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl bg-card/90 backdrop-blur-2xl border border-border/50 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  Interview Report
                  <span className="text-sm font-normal text-muted-foreground capitalize ml-1">
                    — {selectedSession.role ? selectedSession.role.replace('-', ' ') : 'Practice'}
                  </span>
                </h2>
                <button 
                  onClick={() => setSelectedSession(null)}
                  className="p-2.5 hover:bg-secondary/50 rounded-xl transition-all duration-200 active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto">
                {selectedSession.report ? (
                  <div className="prose prose-invert prose-emerald max-w-none prose-headings:font-bold prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
                    <ReactMarkdown>{selectedSession.report}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <div className="w-20 h-20 rounded-3xl bg-secondary/30 border border-border/30 flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="w-10 h-10 opacity-30" />
                    </div>
                    <p className="text-lg font-medium">No report generated</p>
                    <p className="text-sm mt-2 text-muted-foreground/70">AI report was not generated for this session.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard Content */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-10"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{greeting()} 👋</p>
            <h1 className="text-4xl font-bold tracking-tight">
              Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-pink-400">{userName}</span>
            </h1>
            <p className="text-muted-foreground mt-2">Here's an overview of your interview performance.</p>
          </div>
          
          <Link href="/dashboard/interview" 
            className="inline-flex items-center justify-center px-7 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-purple-500 text-white font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95 group"
          >
            <PlayCircle className="w-5 h-5 mr-2.5" />
            Start Interview
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard 
            title="Total Interviews" 
            value={stats.interviewsCompleted} 
            icon={<MessageCircle className="w-5 h-5 text-blue-400" />}
            subtext="Lifetime Total"
            gradient="from-blue-500/10 to-transparent"
          />
          <StatCard 
            title="Avg. Speech Pace" 
            value={`${stats.avgWpm}`} 
            icon={<Activity className="w-5 h-5 text-emerald-400" />}
            subtext={stats.avgWpm > 100 && stats.avgWpm < 160 ? "Healthy Pace" : stats.avgWpm === 0 ? "No Data" : "Needs Adjusting"}
            gradient="from-emerald-500/10 to-transparent"
          />
          <StatCard 
            title="Practice Hours" 
            value={`${stats.hoursPracticed}h`} 
            icon={<Clock className="w-5 h-5 text-purple-400" />}
            subtext="Keep going!"
            gradient="from-purple-500/10 to-transparent"
          />
          <StatCard 
            title="Total Fillers" 
            value={stats.totalFillers} 
            icon={<Flame className="w-5 h-5 text-orange-400" />}
            subtext={stats.totalFillers < 20 ? "Great clarity" : "Needs focus"}
            gradient="from-orange-500/10 to-transparent"
          />
        </motion.div>

        {/* Analytics Charts */}
        {recentInterviews.length > 0 && (
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card/30 backdrop-blur-xl border border-border/40 rounded-3xl p-6 shadow-lg">
               <h2 className="text-base font-semibold flex items-center gap-2.5 mb-6">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  Speech Pace Trend
                  <span className="text-xs font-normal text-muted-foreground ml-auto">WPM over sessions</span>
               </h2>
               <div className="h-64 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={[...recentInterviews].reverse()}>
                     <defs>
                       <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                     <XAxis dataKey="created_at" tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} stroke="#555" fontSize={11} tickLine={false} axisLine={false} />
                     <YAxis stroke="#555" fontSize={11} tickLine={false} axisLine={false} />
                     <RechartsTooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#27272a', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} />
                     <Area type="monotone" dataKey="average_wpm" stroke="#10b981" strokeWidth={2.5} fill="url(#wpmGradient)" dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }} activeDot={{ r: 6, strokeWidth: 2, stroke: '#10b981', fill: '#050505' }} />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>
            
            <div className="bg-card/30 backdrop-blur-xl border border-border/40 rounded-3xl p-6 shadow-lg">
               <h2 className="text-base font-semibold flex items-center gap-2.5 mb-6">
                  <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                    <BarChart2 className="w-4 h-4 text-red-400" />
                  </div>
                  Filler Words
                  <span className="text-xs font-normal text-muted-foreground ml-auto">Count per session</span>
               </h2>
               <div className="h-64 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={[...recentInterviews].reverse()}>
                     <defs>
                       <linearGradient id="fillerGradient" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/>
                         <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                     <XAxis dataKey="created_at" tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} stroke="#555" fontSize={11} tickLine={false} axisLine={false} />
                     <YAxis stroke="#555" fontSize={11} tickLine={false} axisLine={false} />
                     {/* <RechartsTooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#27272a', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} /> */}
                     <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: '#0a0a0a', 
                          borderColor: '#27272a', 
                          borderRadius: '12px', 
                          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                          color: '#b5e6b4ff'  // Add this line
                        }} 
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                      />
                     <Bar dataKey="total_filler_words" fill="url(#fillerGradient)" radius={[8, 8, 0, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </motion.div>
        )}

        {/* Recent Activity & Recommendations */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-5">
            <h2 className="text-lg font-semibold flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              Recent Sessions
            </h2>
            <div className="space-y-3">
              {recentInterviews.length > 0 ? (
                recentInterviews.map((session, i) => {
                  const date = new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  return (
                    <motion.div 
                      key={session.id || i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedSession(session)}
                      className="p-4 rounded-2xl border border-border/30 bg-card/30 backdrop-blur-xl hover:bg-card/50 hover:border-primary/20 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between group cursor-pointer space-y-3 md:space-y-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/10 border border-primary/20 flex items-center justify-center text-primary font-bold uppercase shrink-0 text-sm">
                          {session.role ? session.role.substring(0, 2) : 'AI'}
                        </div>
                        <div>
                          <h4 className="font-semibold group-hover:text-primary transition-colors capitalize text-sm">
                            {session.role ? `${session.role.replace('-', ' ')} Interview` : 'Practice Session'}
                          </h4>
                          <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                            <span>{date}</span>
                            <span className="text-border">•</span>
                            <span>{Math.round((session.duration_seconds || 0) / 60)} min</span>
                            <span className="text-border">•</span>
                            <span>{session.average_wpm || 0} WPM</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs font-medium md:ml-auto">
                          <div className="text-pink-400 bg-pink-500/10 border border-pink-500/20 px-3 py-1.5 rounded-xl">
                            {session.total_filler_words || 0} fillers
                          </div>
                          <div className={`px-3 py-1.5 rounded-xl border ${session.dominant_emotion === 'Nervous' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
                            {session.dominant_emotion || 'Neutral'}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                 <div className="p-10 text-center text-muted-foreground border border-dashed border-border/40 rounded-3xl bg-card/20">
                   <Target className="w-10 h-10 mx-auto mb-4 opacity-30" />
                   <p className="font-medium">No interviews yet</p>
                   <p className="text-sm mt-1 text-muted-foreground/70">Start your first session to see analytics here!</p>
                 </div>
              )}
            </div>
          </div>
          
          {/* Recommended Actions */}
          <div className="space-y-5">
            <h2 className="text-lg font-semibold flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              Recommendations
            </h2>
            
            <div className="space-y-4">
              {stats.interviewsCompleted > 0 && recentInterviews[0]?.total_filler_words > 10 ? (
                <div className="p-6 rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent space-y-4">
                   <div className="flex items-center gap-3">
                     <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                       <Flame className="w-5 h-5 text-red-400" />
                     </div>
                     <h3 className="font-semibold text-red-400">Reduce Fillers</h3>
                   </div>
                   <p className="text-sm text-muted-foreground leading-relaxed">You used <span className="text-red-400 font-bold">{recentInterviews[0].total_filler_words}</span> filler words in your last session. Try pausing instead of saying "um".</p>
                   <button className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/15 text-red-400 rounded-xl text-sm font-medium transition-colors border border-red-500/20">
                     Review Transcript
                   </button>
                </div>
              ) : (
                <div className="p-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-primary">Great Confidence!</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">Your recent sessions show steady pacing and strong confidence. Ready to level up?</p>
                  <Link href="/dashboard/interview" className="block text-center w-full py-2.5 bg-primary/10 hover:bg-primary/15 text-primary rounded-xl text-sm font-medium transition-colors border border-primary/20">
                    Start Technical Drill
                  </Link>
                </div>
              )}

              {/* Quick Tip Card */}
              <div className="p-5 rounded-3xl border border-border/30 bg-card/30 backdrop-blur-xl space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <span className="text-lg">💡</span> Quick Tip
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The ideal speaking pace is 120–150 WPM. Practice pausing after key points for 1-2 seconds to let your answers land with impact.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  )
}
