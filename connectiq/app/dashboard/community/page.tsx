'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Users, Trophy, TrendingUp, Award, ArrowUpRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { name: 'Mon', score: 65 },
  { name: 'Tue', score: 72 },
  { name: 'Wed', score: 78 },
  { name: 'Thu', score: 85 },
  { name: 'Fri', score: 82 },
  { name: 'Sat', score: 90 },
  { name: 'Sun', score: 95 },
]

const leaderboard = [
  { rank: 1, name: 'Alex M.', role: 'Frontend Dev', score: 98, change: '+2' },
  { rank: 2, name: 'Sarah K.', role: 'Data Scientist', score: 96, change: '+5' },
  { rank: 3, name: 'You', role: 'Full Stack', score: 95, change: '+12' },
  { rank: 4, name: 'James L.', role: 'Product Manager', score: 92, change: '-1' },
  { rank: 5, name: 'Emily R.', role: 'UX Designer', score: 89, change: '+3' },
]

export default function CommunityPage() {
  return (
    <div className="space-y-8">
       {/* Header */}
       <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
          Community & Benchmarking
        </h1>
        <p className="text-muted-foreground mt-1">See how you stack up against top candidates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Chart */}
        <div className="lg:col-span-2 space-y-8">
           {/* Global Rank Card */}
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/10 border border-primary/20 flex items-center justify-between"
           >
             <div>
               <h2 className="text-lg font-semibold flex items-center gap-2">
                 <Trophy className="w-5 h-5 text-yellow-500" />
                 Global Ranking
               </h2>
               <p className="text-3xl font-bold mt-2">Top 15%</p>
               <p className="text-sm text-muted-foreground">You're performing better than 85% of peers.</p>
             </div>
             <div className="hidden sm:block">
               <div className="w-24 h-24 rounded-full border-4 border-primary/30 flex items-center justify-center text-xl font-bold">
                 #42
               </div>
             </div>
           </motion.div>

           {/* Performance Chart */}
           <div className="p-6 rounded-2xl bg-card border border-border h-80">
             <h3 className="font-semibold mb-4">Your Growth Trajectory</h3>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data}>
                 <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                 <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #333' }}
                   itemStyle={{ color: '#fff' }}
                 />
                 <Bar dataKey="score" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Right Column: Leaderboard */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Top Performers
          </h3>
          <div className="space-y-4">
            {leaderboard.map((user) => (
              <div 
                key={user.rank} 
                className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                  user.name === 'You' ? 'bg-primary/10 border border-primary/20' : 'hover:bg-secondary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 text-center font-bold ${
                    user.rank === 1 ? 'text-yellow-500' : 
                    user.rank === 2 ? 'text-gray-400' : 
                    user.rank === 3 ? 'text-amber-600' : 'text-muted-foreground'
                  }`}>
                    {user.rank}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{user.score}%</p>
                  <p className={`text-xs flex items-center justify-end ${
                    user.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {user.change.startsWith('+') ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1 rotate-180" />}
                    {user.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-6 py-2 text-sm text-primary hover:underline flex items-center justify-center">
            View Full Leaderboard
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  )
}
