'use client'

import React, { useRef, useState, useEffect } from 'react'
import 'regenerator-runtime/runtime'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  Mic, 
  MessageSquare,
  StopCircle,
  Volume2,
  AlertCircle,
  Briefcase,
  FileText,
  Download,
  ArrowRight
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip, Legend 
} from 'recharts'
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision'
import { createClient } from '@/utils/supabase/client'
import Vapi from '@vapi-ai/web'

// Map of specific Vapi Agents for each role (Option A)
const agentMap: Record<string, string> = {
  'sde-intern': 'e30d2b52-1808-4686-a314-af4d830b5970',
  'full-stack': '8391ae0c-1bf5-4c0f-91ec-379ecdd98092',
  'data-scientist': 'bbce22ea-b78c-4692-926a-d2d1dd795dc8',
  'product-manager': 'de18ede0-1c85-4e5a-8a5b-f36a5486037c',
  'research-analyst': 'd1d9c94a-1d3f-4aa2-86b4-d00c6c1a6288'
}

function useTimer() {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  return { seconds, isRunning, start: () => setIsRunning(true), stop: () => setIsRunning(false), reset: () => setSeconds(0) }
}

export default function InterviewRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id: role } = React.use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const experienceLevel = searchParams.get('exp') || 'Entry Level'
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const timer = useTimer()
  
  // VAPI State
  const [vapi, setVapi] = useState<Vapi | null>(null)
  const [transcriptPreview, setTranscriptPreview] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant' | 'system', content: string }[]>([])

  // Code Editor State
  const [isCoding, setIsCoding] = useState(false)
  const [code, setCode] = useState('// Write your solution here\nfunction solution() {\n  \n}')
  const [isFullScreenLost, setIsFullScreenLost] = useState(false)
  
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Telemetry state
  const [currentEmotion, setCurrentEmotion] = useState("Neutral")
  const [volume, setVolume] = useState<number>(0)
  const [pitch, setPitch] = useState<number>(0)
  const [wpm, setWpm] = useState<number>(0)
  const [fillerWords, setFillerWords] = useState<number>(0)
  const [totalWordsTracker, setTotalWordsTracker] = useState(0)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioReqRef = useRef<number>(0)

  // Report State
  const [isFinished, setIsFinished] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [report, setReport] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Initialize Vapi Instance
  useEffect(() => {
    // Reading from env via hardcoded fallback to prevent Next.js requiring a hard server restart for new env vars.
    const vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_KEY || '5e2c16d8-97b6-4aa0-9657-8bd73c419b49')
    setVapi(vapiInstance)

    vapiInstance.on('error', (error: any) => {
      console.error('Vapi Error Deep:', JSON.stringify(error, null, 2), error)
      const deepMsg = error?.error?.message?.message || error?.error?.message || error?.message || 'Check browser console.'
      setAlertMessage(`VAPI Error: ${deepMsg}`)
      setHasStarted(false)
      timer.stop()
    })

    vapiInstance.on('message', (message: any) => {
      // Track transcripts
      if (message.type === 'transcript') {
         if (message.transcriptType === 'interim') {
             if (message.role === 'user') setTranscriptPreview(message.transcript)
         } else if (message.transcriptType === 'final') {
             if (message.role === 'user') setTranscriptPreview('')
             setMessages(prev => [...prev, { role: message.role, content: message.transcript }])
             
             // Update WPM & Fillers on User's final transcript
             if (message.role === 'user') {
                const words = message.transcript.trim().split(/\s+/).filter((w: string) => w.length > 0).length
                setTotalWordsTracker(prev => prev + words)
                
                const fillers = message.transcript.toLowerCase().match(/\b(um|uh|like|you know|sort of|kind of)\b/g)
                if (fillers) setFillerWords(prev => prev + fillers.length)
             }
         }
      }
    })

    return () => {
      vapiInstance.stop()
      vapiInstance.removeAllListeners()
    }
  }, [])

  // Update WPM during interview
  useEffect(() => {
    if (!hasStarted) return;
    const minutes = timer.seconds / 60;
    if (minutes > 0.05) {
      setWpm(Math.round(totalWordsTracker / minutes));
    }
  }, [timer.seconds, hasStarted, totalWordsTracker])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, transcriptPreview])

  // Audio analysis
  const setupAudioAnalysis = (stream: MediaStream) => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(stream);

    analyser.fftSize = 2048;
    source.connect(analyser);

    audioContextRef.current = audioCtx;
    analyserRef.current = analyser;

    const analyzeAudio = () => {
      if (!analyserRef.current) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      let sum = 0;
      let maxFs = 0;
      let maxIdx = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
        if (dataArray[i] > maxFs) {
          maxFs = dataArray[i];
          maxIdx = i;
        }
      }
      const avgVolume = sum / bufferLength;
      
      const sampleRate = audioCtx.sampleRate;
      const nyquist = sampleRate / 2;
      const currentPitch = (maxIdx / bufferLength) * nyquist;

      setVolume((prev) => prev * 0.8 + avgVolume * 0.2);
      if (avgVolume > 5) {
        setPitch((prev) => prev * 0.8 + currentPitch * 0.2);
      }

      audioReqRef.current = requestAnimationFrame(analyzeAudio);
    };
    analyzeAudio();
  };

  // Webcam Access
  useEffect(() => {
    let stream: MediaStream | null = null;
    let mounted = true;

    const setupMediaPipe = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
      );
      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1
      });
    }

    const startVideo = async () => {
      try {
        await setupMediaPipe();
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        
        setupAudioAnalysis(stream);

        if (mounted && videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.muted = true; 
          
          try {
            await videoRef.current.play();
            requestAnimationFrame(predictWebcam);
          } catch (e) {
             if (e instanceof Error && e.name !== 'AbortError') {
                 console.error('Video play error:', e);
             }
          }
        } else {
             stream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        console.error('Error accessing media devices:', err)
      }
    }

    startVideo()

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (audioReqRef.current) cancelAnimationFrame(audioReqRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    }
  }, [])

  // Face Analysis Loop
  const predictWebcam = () => {
    if (!faceLandmarkerRef.current || !videoRef.current) return;
    
    let startTimeMs = performance.now();
    try {
        if (videoRef.current.currentTime > 0) {
           const results = faceLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
           
           if (results.faceLandmarks.length > 0) {
              const blendshapes = results.faceBlendshapes?.[0]?.categories || [];
              const getScore = (name: string) => blendshapes.find((c: any) => c.categoryName === name)?.score || 0;
              
              const lookLeft = getScore("eyeLookOutRight") + getScore("eyeLookInLeft");
              const lookRight = getScore("eyeLookOutLeft") + getScore("eyeLookInRight");
              const lookUp = getScore("eyeLookUpLeft") + getScore("eyeLookUpRight");
              const lookDown = getScore("eyeLookDownLeft") + getScore("eyeLookDownRight");
              
              const EYE_THRESHOLD = 0.8;
              let lookAwayMessage = null;
              if (lookLeft > EYE_THRESHOLD || lookRight > EYE_THRESHOLD || lookUp > EYE_THRESHOLD || lookDown > EYE_THRESHOLD) {
                lookAwayMessage = "Maintain eye contact";
              } 
              
              const noseTip = results.faceLandmarks[0][1];
              if (noseTip.x < 0.3 || noseTip.x > 0.7) {
                 setAlertMessage("Center your face in the frame");
              } else if (lookAwayMessage) {
                 setAlertMessage(lookAwayMessage);
              } else {
                 setAlertMessage(null);
              }

              // Emotion
              const browInnerUp = getScore("browInnerUp");
              const mouthFrownL = getScore("mouthFrownLeft");
              const mouthFrownR = getScore("mouthFrownRight");
              const browDownL = getScore("browDownLeft");
              const browDownR = getScore("browDownRight");
              const mouthSmileL = getScore("mouthSmileLeft");
              const mouthSmileR = getScore("mouthSmileRight");

              let emotionDetected = "Neutral";
              if (mouthSmileL > 0.5 || mouthSmileR > 0.5) emotionDetected = "Happy / Confident";
              else if (browInnerUp > 0.4 && (mouthFrownL > 0.4 || mouthFrownR > 0.4)) emotionDetected = "Nervous";
              else if (browDownL > 0.4 && browDownR > 0.4) emotionDetected = "Thinking / Tense";
              
              setCurrentEmotion(emotionDetected);

           } else {
              setAlertMessage("Face not detected!");
              setCurrentEmotion("Unknown");
           }
        }
    } catch(err) {
      console.log(err)
    }
    
    requestAnimationFrame(predictWebcam);
  };

  // Start/Stop Logic
  const handleStartInterview = async () => {
    setHasStarted(true)
    timer.start()
    
    // Retrieve Setup Data
    const resume = typeof window !== 'undefined' ? sessionStorage.getItem('interview_resume') || 'No resume uploaded.' : ''
    const jd = typeof window !== 'undefined' ? sessionStorage.getItem('interview_jd') || 'General Interview' : ''
    
    // Get the specific Agent based on Role Mapping
    // If the user already pasted the Agent ID in the setup URL (e.g. 31f70ad...), we use that directly!
    const agentId = agentMap[role] || role

    // Pass the Context variables securely without breaking the VAPI model schema
    await vapi?.start(agentId, {
       // Safest way is using template variables (requires setting {{resume}} in Vapi Dashboard)
       variableValues: {
         role: role,
         experience_level: experienceLevel,
         resume: resume,
         job_description: jd
       }
    })
  }

  const handleEndInterview = async () => {
    setHasStarted(false)
    timer.stop()
    
    vapi?.stop()
    
    if (document.fullscreenElement) {
       document.exitFullscreen().catch(e => console.log(e));
    }

    // Save Session to Database
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase.from('interview_sessions').insert({
        user_id: user.id,
        role: role,
        experience_level: experienceLevel,
        duration_seconds: timer.seconds,
        average_wpm: wpm,
        total_filler_words: fillerWords,
        average_pitch: pitch,
        dominant_emotion: currentEmotion
      }).select().single()

      if (data) {
        setSessionId(data.id)
      }
    }

    setIsFinished(true)
  }

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true)
    const resume = typeof window !== 'undefined' ? sessionStorage.getItem('interview_resume') || '' : ''
    
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          messages,
          wpm,
          fillerWords,
          emotion: currentEmotion,
          duration: timer.seconds,
          resume
        })
      })
      const data = await res.json()
      if (data.report) {
        setReport(data.report)
        // Store report in DB if session exists
        if (sessionId) {
          const supabase = createClient()
          await supabase.from('interview_sessions').update({ report: data.report }).eq('id', sessionId)
        }
      } else {
        setAlertMessage("Failed to generate report.")
      }
    } catch (err) {
      console.error(err)
      setAlertMessage("Error generating report.")
    } finally {
      setIsGeneratingReport(false)
    }
  }

  // Strict Full Screen Enforcement
  useEffect(() => {
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement && hasStarted) {
         setIsFullScreenLost(true)
         timer.stop()
         vapi?.stop()
      }
    }

    if (hasStarted) {
      document.documentElement.requestFullscreen().catch(e => console.log(e));
      
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('fullscreenchange', handleFullScreenChange);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('fullscreenchange', handleFullScreenChange);
      }
    }
  }, [hasStarted, vapi])

  const handleResumeFullScreen = async () => {
    document.documentElement.requestFullscreen().then(() => {
      setIsFullScreenLost(false)
      timer.start()
      // Note: Re-starting the VAPI call here essentially restarts the interview.
      // A more complex setup would use `vapi.start` with a memory buffer.
      handleStartInterview()
    }).catch(err => {
      alert("Could not enter full screen. Please try again.")
    })
  }

  // Hydration Safe Check
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true) }, []);
  
  if (!isMounted) return null;

  // Render Blocking Overlay
  if (isFullScreenLost && hasStarted) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 gap-6">
        <AlertCircle className="w-16 h-16 text-destructive animate-bounce" />
        <h1 className="text-3xl font-bold text-destructive">Interview Paused</h1>
        <p className="text-xl text-muted-foreground max-w-md">
          You have exited full-screen mode. This is a violation of the interview protocol.
        </p>
        <button 
          onClick={handleResumeFullScreen}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
        >
          Resume Interview
        </button>
      </div>
    )
  }

  // Post-Interview Report Screen
  if (isFinished) {
    const wpmScore = Math.min(100, Math.max(0, 100 - Math.abs(wpm - 130)));
    const fillerScore = Math.max(0, 100 - (fillerWords * 5));
    let sentimentScore = 50;
    if (currentEmotion === 'Happy / Confident') sentimentScore = 90;
    if (currentEmotion === 'Nervous') sentimentScore = 30;
    if (currentEmotion === 'Thinking / Tense') sentimentScore = 70;

    const radarData = [
      { subject: 'Pace', A: wpmScore, fullMark: 100 },
      { subject: 'Clarity', A: fillerScore, fullMark: 100 },
      { subject: 'Confidence', A: sentimentScore, fullMark: 100 },
      { subject: 'Timing', A: Math.min(100, (timer.seconds / 600) * 100), fullMark: 100 }
    ];

    const pieData = [
      { name: 'Core Words', value: Math.max(1, totalWordsTracker - fillerWords) },
      { name: 'Fillers', value: fillerWords }
    ];
    const PIE_COLORS = ['#10b981', '#ef4444'];

    return (
      <div className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-start max-w-5xl mx-auto space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 w-full pt-8"
        >
          <motion.div 
            initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.4 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-emerald-500/30"
          >
            <StopCircle className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight">
            Interview <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">Completed</span>
          </h1>
          <p className="text-lg text-muted-foreground">Great job! Your session has been securely saved.</p>
        </motion.div>

        {!report ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl bg-card/30 backdrop-blur-2xl border border-border/40 rounded-3xl p-8 shadow-2xl text-center space-y-8"
          >
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="p-5 bg-background/40 rounded-3xl border border-border/30 backdrop-blur-xl">
                  <div className="text-3xl font-bold text-foreground">{wpm}</div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] mt-1.5 font-semibold">WPM</div>
                </div>
                <div className="p-5 bg-background/40 rounded-3xl border border-red-500/20">
                  <div className="text-3xl font-bold text-red-400">{fillerWords}</div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] mt-1.5 font-semibold">Fillers</div>
                </div>
                <div className="p-5 bg-background/40 rounded-3xl border border-primary/20">
                  <div className="text-3xl font-bold text-primary">{Math.round(timer.seconds / 60)}m</div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] mt-1.5 font-semibold">Duration</div>
                </div>
                <div className="p-5 bg-background/40 rounded-3xl border border-border/30 backdrop-blur-xl">
                  <div className="text-lg font-bold text-foreground truncate">{currentEmotion}</div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] mt-1.5 font-semibold">Mood</div>
                </div>
             </div>

             <div className="grid md:grid-cols-2 gap-6 mb-8">
               <div className="h-64 bg-background/30 rounded-3xl border border-border/30 backdrop-blur-xl p-5 flex flex-col items-center relative">
                 <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-[0.15em]">Performance Radar</h3>
                 <ResponsiveContainer width="100%" height="100%">
                   <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                     <PolarGrid stroke="#333" />
                     <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12 }} />
                     <Radar name="Score" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                     <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#10b981' }} />
                   </RadarChart>
                 </ResponsiveContainer>
               </div>
               <div className="h-64 bg-background/30 rounded-3xl border border-border/30 backdrop-blur-xl p-5 flex flex-col items-center relative">
                 <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-[0.15em]">Speech Composition</h3>
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={pieData}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                     >
                       {pieData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }} />
                     <Legend verticalAlign="bottom" height={36} iconType="circle" />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
             </div>

             <div className="space-y-4">
               <button
                 onClick={handleGenerateReport}
                 disabled={isGeneratingReport}
                 className="w-full md:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full text-lg shadow-xl hover:shadow-primary/20 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 mx-auto"
               >
                 {isGeneratingReport ? (
                   <>
                     <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                     Analyzing Performance...
                   </>
                 ) : (
                   <>
                     <FileText className="w-6 h-6" />
                     Generate Detailed Report
                   </>
                 )}
               </button>
               <button
                 onClick={() => router.push('/dashboard')}
                 className="w-full md:w-auto px-8 py-4 text-muted-foreground hover:text-foreground font-medium transition-colors"
               >
                 Return to Dashboard
               </button>
             </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-card/80 backdrop-blur-xl border border-border rounded-3xl p-6 md:p-10 shadow-2xl space-y-8"
          >
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
               <h2 className="text-2xl font-bold flex items-center gap-3">
                 <FileText className="w-6 h-6 text-primary" />
                 Performance Analysis
               </h2>
               <div className="flex gap-4">
                  <button onClick={() => router.push('/dashboard')} className="px-6 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold rounded-xl transition-colors flex items-center gap-2">
                    Dashboard <ArrowRight className="w-4 h-4" />
                  </button>
               </div>
             </div>
             
             <div className="prose prose-invert prose-emerald max-w-none">
               <ReactMarkdown>{report}</ReactMarkdown>
             </div>
          </motion.div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen p-3 md:p-5 flex flex-col gap-5 relative max-w-[1600px] mx-auto">
      {/* Code Editor Modal/Overlay */}
      <AnimatePresence>
        {isCoding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-40 bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden m-6"
          >
            <div className="bg-secondary/50 p-4 border-b border-border flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-500" />
                 <div className="w-3 h-3 rounded-full bg-yellow-500" />
                 <div className="w-3 h-3 rounded-full bg-green-500" />
                 <span className="ml-4 font-mono text-sm text-muted-foreground">liveshare_interview_session.js</span>
               </div>
               <button 
                 onClick={() => setIsCoding(false)}
                 className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-md"
               >
                 Submit Solution
               </button>
            </div>
            <div className="flex-1 bg-[#1e1e1e] p-4">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full bg-transparent text-gray-300 font-mono text-sm resize-none focus:outline-none"
                spellCheck="false"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)] w-full">
        {/* Left Panel: Video Feed & Real-time Feedback & Telemetry */}
        <div className="flex-1 flex flex-col gap-4 relative max-h-screen">
          <div className="relative flex-1 bg-black rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-border/30 min-h-[40vh]">
            <video 
              ref={videoRef}
              muted
              className="w-full h-full object-cover transform scale-x-[-1]" 
            />
            
            {/* AI Alerts Overlay */}
            <AnimatePresence>
              {alertMessage && (
                <motion.div 
                   initial={{ opacity: 0, y: -20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="absolute top-[10%] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 border border-white/20"
                >
                    <AlertCircle className="w-6 h-6 animate-pulse" />
                    <span className="font-bold text-lg">{alertMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Overlay Status */}
            <div className="absolute top-4 left-4 flex gap-2">
              {hasStarted && (
                <span className="bg-emerald-500/80 text-white text-xs px-2 py-1 rounded-full animate-pulse flex items-center shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full mr-1" />
                  VAPI LIVE
                </span>
              )}
              <span className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center">
                <Mic className={`w-3 h-3 mr-1 ${hasStarted ? 'text-green-400' : 'text-gray-400'}`} />
                {hasStarted ? 'Recording...' : 'Mic Ready'}
              </span>
            </div>

            {!hasStarted && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-6 text-center z-10 backdrop-blur-md">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center mx-auto shadow-2xl shadow-primary/30">
                    <Mic className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white">Ready to Start?</h2>
                  <p className="text-gray-400">Applying for: <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 font-bold uppercase">{role.replace('-', ' ')}</span></p>
                  <button 
                    onClick={handleStartInterview}
                    className="px-10 py-4 bg-gradient-to-r from-red-600 to-rose-500 text-white rounded-2xl font-bold shadow-2xl shadow-red-500/30 transition-all transform hover:scale-105 active:scale-95 text-lg flex items-center gap-3 mx-auto"
                  >
                    <Mic className="w-5 h-5" />
                    Start Call with AI
                  </button>
                </motion.div>
              </div>
            )}
            
            {/* Audio Visualizer Overlay on Video Screen */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-3 flex flex-col pointer-events-none">
                <div className="flex items-end gap-1 h-8 w-full opacity-80 mb-1">
                  {Array.from({length: 40}).map((_, i) => (
                    <div key={i} className="flex-1 rounded-t-sm transition-all duration-75" style={{ 
                        backgroundColor: volume > (i * 2.5) ? '#10b981' : '#27272a',
                        height: volume > (i * 2.5) ? `${Math.min(100, Math.max(10, volume * (1 + Math.random() * 0.5)))}%` : '10%' 
                    }}></div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-300 tracking-wider">
                   <span>LIVE AUDIO INTENSITY</span>
                   <span className="text-primary font-bold">{volume.toFixed(1)} dB</span>
                </div>
            </div>
          </div>

          {/* Real-time Telemetry Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-card/30 backdrop-blur-2xl border border-border/30 rounded-2xl p-4 flex flex-col">
              <span className="text-[10px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-[0.15em]">Facial Emotion</span>
              <div className="text-base font-bold text-foreground truncate">{currentEmotion}</div>
            </div>
            <div className="bg-card/30 backdrop-blur-2xl border border-border/30 rounded-2xl p-4 flex flex-col">
              <span className="text-[10px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-[0.15em]">Est. Pitch</span>
              <div className="text-base font-bold text-primary truncate">{pitch > 0 ? `${pitch.toFixed(0)} Hz` : '--'}</div>
            </div>
            <div className="bg-card/30 backdrop-blur-2xl border border-border/30 rounded-2xl p-4 flex flex-col">
              <span className="text-[10px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-[0.15em]">Speech Pace</span>
              <div className={`text-base font-bold truncate ${wpm > 170 || (wpm > 0 && wpm < 100) ? 'text-orange-400' : 'text-foreground'}`}>
                {wpm > 0 ? `${wpm} WPM` : '--'}
              </div>
            </div>
            <div className="bg-card/30 backdrop-blur-2xl border border-border/30 rounded-2xl p-4 flex flex-col">
              <span className="text-[10px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-[0.15em]">Filler Words</span>
              <div className="text-base font-bold text-red-400 truncate">{fillerWords} detected</div>
            </div>
          </div>

          {/* Real-time Insights Bar */}
          <div className="bg-card/30 backdrop-blur-2xl border border-border/30 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/10 border border-primary/20 flex items-center justify-center">
                 <Volume2 className="w-5 h-5 text-primary animate-pulse" />
               </div>
               <div>
                 <h4 className="font-semibold text-sm">AI Interviewer</h4>
                 <p className="text-[11px] text-muted-foreground">Powered by VAPI</p>
               </div>
            </div>
            <div className="text-right">
               <div className="text-2xl font-mono tabular-nums font-bold tracking-tight">
                 {String(Math.floor(timer.seconds / 60)).padStart(2, '0')}:
                 {String(timer.seconds % 60).padStart(2, '0')}
               </div>
               <div className="text-[10px] text-muted-foreground uppercase tracking-wider">in session</div>
            </div>
          </div>
        </div>

        {/* Right Panel: Conversation Log */}
        <div className="w-full md:w-96 flex flex-col bg-card/30 backdrop-blur-2xl border border-border/30 rounded-3xl overflow-hidden shadow-xl h-full">
          <div className="p-4 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent sticky top-0 z-10 flex justify-between items-center">
            <div>
              <h3 className="font-bold flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-primary" />
                <span className="capitalize">{role.replace('-', ' ')}</span>
              </h3>
              <p className="text-[11px] text-muted-foreground">Live Transcription</p>
            </div>
            {hasStarted && !isCoding && (
               <button 
                 onClick={handleEndInterview}
                 className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 flex items-center gap-2 text-sm font-semibold shadow-lg shadow-destructive/20 transition-all active:scale-95"
               >
                 <StopCircle className="w-4 h-4" />
                 End Interview
               </button>
            )}
            {hasStarted && isCoding && (
               <button 
                 onClick={() => setIsCoding(false)}
                 className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2 text-sm font-semibold shadow-lg transition-all active:scale-95"
               >
                 Submit Code
               </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    msg.role === 'assistant' ? 'bg-gradient-to-tr from-primary to-purple-500 text-white' : 'bg-secondary text-foreground'
                  }`}>
                    {msg.role === 'assistant' ? 'AI' : 'Me'}
                  </div>
                  <div className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                    msg.role === 'assistant' 
                      ? 'bg-secondary/50 rounded-tl-none' 
                      : 'bg-primary/10 text-primary rounded-tr-none'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Live Transcript Preview */}
            {transcriptPreview && (
              <div className="text-xs text-muted-foreground italic text-right px-2 border-r-2 border-primary animate-pulse">
                "{transcriptPreview}"
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
