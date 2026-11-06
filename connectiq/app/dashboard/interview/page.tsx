'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  Code2, 
  Beaker, 
  PenTool, 
  Briefcase, 
  Play, 
  FileText, 
  UploadCloud,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Shield,
  Sparkles,
  Zap,
  Target,
  ChevronRight
} from 'lucide-react'

// Job Roles Config
const jobRoles = [
  {
    id: 'sde-intern',
    title: 'SDE Intern',
    icon: Code2,
    gradient: 'from-blue-500 to-cyan-500',
    bgGlow: 'bg-blue-500/8',
    borderActive: 'border-blue-500/40',
    textColor: 'text-blue-400',
    description: 'Data structures, algorithms, and core CS fundamentals.',
    skills: ['Java/C++', 'DSA', 'OOPs', 'System Design'],
    level: 'Entry'
  },
  {
    id: 'full-stack',
    title: 'Full Stack Dev',
    icon: Building2,
    gradient: 'from-purple-500 to-violet-500',
    bgGlow: 'bg-purple-500/8',
    borderActive: 'border-purple-500/40',
    textColor: 'text-purple-400',
    description: 'React, Node.js, databases, and API design.',
    skills: ['React', 'Node.js', 'SQL/NoSQL', 'APIs'],
    level: 'Mid'
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    icon: Beaker,
    gradient: 'from-emerald-500 to-teal-500',
    bgGlow: 'bg-emerald-500/8',
    borderActive: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
    description: 'Statistics, machine learning models, and data visualization.',
    skills: ['Python', 'SQL', 'ML', 'Pandas'],
    level: 'Mid-Senior'
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    icon: Briefcase,
    gradient: 'from-orange-500 to-amber-500',
    bgGlow: 'bg-orange-500/8',
    borderActive: 'border-orange-500/40',
    textColor: 'text-orange-400',
    description: 'Product sense, metrics, and stakeholder management.',
    skills: ['Strategy', 'UX', 'Agile', 'Analytics'],
    level: 'Senior'
  },
  {
    id: 'research-analyst',
    title: 'Research Analyst',
    icon: PenTool,
    gradient: 'from-pink-500 to-rose-500',
    bgGlow: 'bg-pink-500/8',
    borderActive: 'border-pink-500/40',
    textColor: 'text-pink-400',
    description: 'Market research, financial modeling, and trend analysis.',
    skills: ['Excel', 'Research', 'Modeling', 'Reporting'],
    level: 'Entry-Mid'
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', bounce: 0.3 } }
}

export default function InterviewSetupPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('Entry Level')
  const [step, setStep] = useState(1)
  const [isUploading, setIsUploading] = useState(false)

  const selectedRoleData = jobRoles.find(r => r.id === selectedRole)

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return;
    setIsUploading(true)
    try {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map((item: any) => item.str).join(' ')
        fullText += pageText + ' '
      }
      setResumeText(fullText.substring(0, 5000)) // Protect prompt token limits
    } catch (err) {
      console.error(err)
      alert('Could not read PDF. Please paste manually.')
    }
    setIsUploading(false)
  }

  const handleStart = () => {
    if (selectedRole) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('interview_resume', resumeText)
        sessionStorage.setItem('interview_jd', jobDescription)
      }
      router.push(`/dashboard/interview/${selectedRole}?exp=${experienceLevel}`)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Progress Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden backdrop-blur-sm">
          <motion.div 
            className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div 
              key={s}
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                s <= step 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'bg-secondary/30 text-muted-foreground border border-border/30'
              } ${s === step ? 'ring-2 ring-primary/20 shadow-lg shadow-primary/10' : ''}`}
            >
              {s < step ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ─── STEP 1: Role Selection ─── */}
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="text-center space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold gap-1.5"
              >
                <Target className="w-3.5 h-3.5" />
                Step 1 — Choose Your Focus
              </motion.div>
              <h1 className="text-4xl font-bold tracking-tight">Select Your Target Role</h1>
              <p className="text-muted-foreground max-w-lg mx-auto">Pick the role you're preparing for. Our AI will tailor the entire interview experience to match.</p>
            </div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {jobRoles.map((role) => (
                <motion.div
                  key={role.id}
                  variants={cardVariants}
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedRole(role.id); setStep(2); }}
                  className={`cursor-pointer rounded-3xl p-6 border transition-all duration-300 relative overflow-hidden group backdrop-blur-xl ${
                    selectedRole === role.id 
                      ? `${role.borderActive} ${role.bgGlow} ring-1 ring-primary/10` 
                      : 'border-border/30 bg-card/30 hover:border-border/60'
                  }`}
                >
                  {/* Hover gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />
                  
                  <div className="relative z-10">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center text-white mb-5 shadow-lg group-hover:shadow-xl transition-shadow`}>
                      <role.icon className="w-7 h-7" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg">{role.title}</h3>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{role.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {role.skills.map(skill => (
                        <span key={skill} className="text-[11px] px-2.5 py-1 bg-background/50 border border-border/30 rounded-lg text-muted-foreground font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* ─── STEP 2: Customize ─── */}
        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 max-w-2xl mx-auto"
          >
            <div className="text-center space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                Step 2 — Personalize
              </motion.div>
              <h1 className="text-4xl font-bold tracking-tight">Customize Your Session</h1>
              <p className="text-muted-foreground">Provide your resume and job details for a hyper-personalized experience.</p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card/30 backdrop-blur-xl border border-border/30 rounded-3xl p-8 space-y-7"
            >
              {/* Experience Level */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-foreground">Experience Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Entry Level', 'Mid-Senior', 'Lead/Manager'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setExperienceLevel(level)}
                      className={`py-3.5 px-4 rounded-2xl text-sm font-medium transition-all duration-200 border active:scale-95 ${
                        experienceLevel === level 
                          ? 'bg-gradient-to-r from-primary to-purple-500 text-white border-primary/50 shadow-lg shadow-primary/20' 
                          : 'bg-secondary/30 hover:bg-secondary/50 border-border/30 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job Description */}
              <div>
                <label className="block text-sm font-semibold mb-3">
                  Job Description <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <div className="relative group">
                  <FileText className="absolute top-4 left-4 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <textarea 
                    className="w-full min-h-[100px] bg-background/50 border border-border/30 rounded-2xl p-4 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 resize-none transition-all placeholder:text-muted-foreground/50"
                    placeholder="Paste the JD here for tailored questions..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-semibold mb-3">
                  Resume <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <label className="cursor-pointer border-2 border-dashed border-primary/20 bg-primary/5 rounded-2xl p-6 hover:bg-primary/10 hover:border-primary/30 transition-all text-center group active:scale-[0.98]">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-primary block">
                      {isUploading ? 'Analyzing PDF...' : 'Upload PDF'}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1 block">Max 5MB</span>
                    <input type="file" accept=".pdf" onChange={handleResumeUpload} className="hidden" />
                  </label>
                  <div className="flex items-center justify-center text-center border-2 border-dashed border-border/20 rounded-2xl p-6">
                    <div>
                      <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-40" />
                      <span className="text-xs text-muted-foreground">Or paste raw text below</span>
                    </div>
                  </div>
                </div>
                <div className="relative group">
                  <textarea 
                    className="w-full min-h-[100px] bg-background/50 border border-border/30 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 resize-none transition-all placeholder:text-muted-foreground/50"
                    placeholder={isUploading ? "Parsing your PDF..." : "Resume text appears here after upload or paste directly..."}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                  />
                  {resumeText && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" />
                      Resume loaded
                    </div>
                  )}
                </div>
              </div>
               
              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => setStep(1)} 
                  className="flex-1 py-3.5 rounded-2xl border border-border/30 hover:bg-secondary/40 transition-all text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button 
                  onClick={() => setStep(3)} 
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-purple-500 text-white font-bold hover:shadow-lg hover:shadow-primary/20 transition-all text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* ─── STEP 3: Launch ─── */}
        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-10 max-w-2xl mx-auto py-8"
          >
            {/* Animated launch icon */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.4, delay: 0.1 }}
              className="relative mx-auto w-32 h-32"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-2 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary to-purple-500 rounded-full flex items-center justify-center shadow-2xl shadow-primary/30">
                <Play className="w-12 h-12 text-white ml-1.5" />
              </div>
            </motion.div>
             
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h1 className="text-5xl font-bold tracking-tight">You're All Set!</h1>
              <p className="text-xl text-muted-foreground">
                Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 font-bold capitalize">{selectedRole?.replace('-', ' ')}</span> interview is ready.
              </p>
            </motion.div>

            {/* Session summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-3"
            >
              <div className="px-4 py-2 rounded-2xl bg-card/40 border border-border/30 backdrop-blur-xl text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="capitalize">{selectedRole?.replace('-', ' ')}</span>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-card/40 border border-border/30 backdrop-blur-xl text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <span>{experienceLevel}</span>
              </div>
              {resumeText && (
                <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-sm flex items-center gap-2 text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  Resume attached
                </div>
              )}
            </motion.div>

            {/* Proctoring warning */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-2.5 text-sm text-yellow-400 bg-yellow-500/10 px-5 py-3 rounded-2xl border border-yellow-500/20"
            >
              <Shield className="w-4 h-4" />
              This session is proctored. Full screen mode will be enabled.
            </motion.div>

            {/* Launch Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <button 
                onClick={handleStart}
                className="px-14 py-5 rounded-full bg-gradient-to-r from-primary to-purple-500 text-white text-lg font-bold shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto group"
              >
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Enter Interview Room
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button onClick={() => setStep(2)} className="block mx-auto text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" />
                Adjust Settings
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
