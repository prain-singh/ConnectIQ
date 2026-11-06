'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Bell, 
  Shield, 
  Moon, 
  Monitor, 
  Smartphone,
  Save,
  CheckCircle2
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()
  
  const [profile, setProfile] = useState({
    fullName: '',
    username: '',
    email: '',
    bio: ''
  })

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    interviewReminders: true,
    weeklyReports: false
  })

  useEffect(() => {
    // Fetch user basic info to populate the form
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setProfile(prev => ({ ...prev, email: user.email || '' }))
      }
    }
    fetchUser()
  }, [])

  const handleSave = () => {
    setLoading(true)
    // Simulate API call for saving settings
    setTimeout(() => {
      setLoading(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 1000)
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Moon },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  ]

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and settings.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="md:w-64 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Settings Content Area */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8"
          >
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Profile Information</h2>
                  <p className="text-sm text-muted-foreground mb-6">Update your personal details and public profile.</p>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <input 
                      type="text" 
                      value={profile.fullName}
                      onChange={e => setProfile({...profile, fullName: e.target.value})}
                      placeholder="John Doe" 
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Username</label>
                    <input 
                      type="text" 
                      value={profile.username}
                      onChange={e => setProfile({...profile, username: e.target.value})}
                      placeholder="johndoe123" 
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <input 
                      type="email" 
                      value={profile.email}
                      disabled
                      className="w-full bg-background/50 border border-border rounded-xl px-4 py-2 opacity-70 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Email address is managed by your authentication provider.</p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Bio</label>
                    <textarea 
                      value={profile.bio}
                      onChange={e => setProfile({...profile, bio: e.target.value})}
                      placeholder="Tell us a little about yourself..." 
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Notification Preferences</h2>
                  <p className="text-sm text-muted-foreground mb-6">Choose what you want to be notified about.</p>
                </div>
                
                <div className="space-y-4">
                  {[
                    { id: 'emailAlerts', label: 'Email Alerts', desc: 'Receive important system alerts via email.' },
                    { id: 'interviewReminders', label: 'Interview Reminders', desc: 'Get notified before a scheduled practice session.' },
                    { id: 'weeklyReports', label: 'Weekly Progress Reports', desc: 'Receive a weekly summary of your performance.' }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border border-border rounded-xl bg-background/50">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={(notifications as any)[item.id]}
                          onChange={() => setNotifications({...notifications, [item.id]: !(notifications as any)[item.id]})}
                        />
                        <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Appearance</h2>
                  <p className="text-sm text-muted-foreground mb-6">Customize the look and feel of your dashboard.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'system', icon: Monitor, label: 'System' },
                    { id: 'light', icon: Smartphone, label: 'Light' },
                    { id: 'dark', icon: Moon, label: 'Dark' }
                  ].map((theme) => {
                    const Icon = theme.icon
                    const isSelected = theme.id === 'dark' // Hardcoded for this template
                    return (
                      <button
                        key={theme.id}
                        className={`flex flex-col items-center gap-3 p-6 rounded-xl border ${
                          isSelected 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border bg-background/50 hover:bg-secondary'
                        } transition-all`}
                      >
                        <Icon className={`w-8 h-8 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="font-medium">{theme.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Privacy & Security</h2>
                  <p className="text-sm text-muted-foreground mb-6">Manage your data and security settings.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-xl bg-background/50 flex items-center justify-between">
                    <div>
                      <p className="font-medium">Data Collection</p>
                      <p className="text-sm text-muted-foreground">Allow us to collect usage data to improve ConnectIQ.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  
                  <div className="p-4 border border-red-500/20 rounded-xl bg-red-500/5">
                    <p className="font-medium text-red-500">Danger Zone</p>
                    <p className="text-sm text-muted-foreground mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                    <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium rounded-lg transition-colors">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Footer */}
            <div className="mt-8 pt-6 border-t border-border flex items-center justify-end gap-4">
              <span className="text-sm text-emerald-500 flex items-center gap-1 opacity-0 transition-opacity" style={{ opacity: saved ? 1 : 0 }}>
                <CheckCircle2 className="w-4 h-4" />
                Settings saved
              </span>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
