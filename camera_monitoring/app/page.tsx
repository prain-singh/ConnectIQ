"use client";

import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// Types for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function CameraMonitoring() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  // Stats State
  const [currentEmotion, setCurrentEmotion] = useState("Neutral");
  const [volume, setVolume] = useState<number>(0);
  const [pitch, setPitch] = useState<number>(0);
  const [wpm, setWpm] = useState<number>(0);
  const [fillerWords, setFillerWords] = useState<number>(0);

  const [alerts, setAlerts] = useState<{
    lookAway: string | null;
    emotion: string | null;
    speech: string | null;
  }>({ lookAway: null, emotion: null, speech: null });

  // Refs for logic
  const requestRef = useRef<number>(0);
  const audioReqRef = useRef<number>(0);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  const startTimeRef = useRef<number>(0);
  const wordsSpokenRef = useRef<number>(0);

  useEffect(() => {
    // Suppress MediaPipe's internal informational logs that use console.error
    const originalError = console.error;
    console.error = (...args) => {
      if (typeof args[0] === "string" && args[0].includes("Created TensorFlow Lite")) return;
      originalError(...args);
    };

    const initializeMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU",
          },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
          runningMode: "VIDEO",
          numFaces: 1,
        });
        landmarkerRef.current = faceLandmarker;
        setIsModelLoaded(true);
        startMedia();
      } catch (error) {
        originalError("Error loading MediaPipe model:", error);
      }
    };

    initializeMediaPipe();

    return () => {
      console.error = originalError;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (audioReqRef.current) cancelAnimationFrame(audioReqRef.current);

      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      if (landmarkerRef.current) landmarkerRef.current.close();
      if (audioContextRef.current) audioContextRef.current.close();
      if (speechRecognitionRef.current) speechRecognitionRef.current.stop();
    };
  }, []);

  const startMedia = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" },
          audio: true,
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", predictWebcam);
        }

        setupAudioAnalysis(stream);
        setupSpeechRecognition();
        
      } catch (error) {
        console.error("Camera/Mic error:", error);
      }
    }
  };

  // --- AUDIO AND SPEECH TIMING START ---
  const handleStartSpeechAnalysis = () => {
    startTimeRef.current = Date.now();
    wordsSpokenRef.current = 0;
    try {
      speechRecognitionRef.current?.start();
    } catch (e) {}
  };
  // -------------------------------------

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

      // Simple Volume
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
      
      // Simple Pitch approximation
      const sampleRate = audioCtx.sampleRate;
      const nyquist = sampleRate / 2;
      const currentPitch = (maxIdx / bufferLength) * nyquist;

      // Smooth updates slightly
      setVolume((prev) => prev * 0.8 + avgVolume * 0.2);
      if (avgVolume > 5) {
        setPitch((prev) => prev * 0.8 + currentPitch * 0.2);
      }

      audioReqRef.current = requestAnimationFrame(analyzeAudio);
    };
    analyzeAudio();
  };

  const setupSpeechRecognition = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn("Speech Recognition API not supported in this browser");
      return;
    }

    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let latestFillers = 0;
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript.trim();
          
          // Words 
          const words = transcript.split(/\s+/).length;
          wordsSpokenRef.current += words;

          // Fillers
          const text = transcript.toLowerCase();
          const matches = text.match(/\b(um|uh|like|you know|sort of|kind of)\b/g);
          if (matches) {
            latestFillers += matches.length;
          }
        }
      }

      if (latestFillers > 0) {
        setFillerWords((prev) => prev + latestFillers);
        setAlerts((prev) => ({
          ...prev,
          speech: "Avoid using filler words like 'um' or 'like'.",
        }));
        setTimeout(() => setAlerts((prev) => ({ ...prev, speech: null })), 4000);
      }

      // WPM Calculation
      if (startTimeRef.current > 0) {
        const minutes = (Date.now() - startTimeRef.current) / 60000;
        if (minutes > 0.1) {
          const currentWpm = Math.round(wordsSpokenRef.current / minutes);
          setWpm(currentWpm);

          if (currentWpm > 170) {
            setAlerts((prev) => ({ ...prev, speech: "Speaking too fast! Slow down your pace." }));
          } else if (currentWpm < 100 && currentWpm > 30) {
            setAlerts((prev) => ({ ...prev, speech: "Pace is a bit slow. Try to be more fluent." }));
          } else if (!latestFillers) {
             setAlerts((prev) => ({ ...prev, speech: null })); // clear if pacing is good
          }
        }
      }
    };

    recognition.onend = () => {
      // Auto restart to maintain continuous listening during interview
      try { recognition.start(); } catch (e) {}
    };

    speechRecognitionRef.current = recognition;
    handleStartSpeechAnalysis(); // auto start
  };

  const predictWebcam = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const faceLandmarker = landmarkerRef.current;

    if (!video || !canvas || !faceLandmarker) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastVideoTime = -1;

    const renderLoop = async () => {
      const startTimeMs = performance.now();
      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const results = faceLandmarker.detectForVideo(video, startTimeMs);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
          setFaceDetected(true);
          const blendshapes = results.faceBlendshapes[0].categories;
          analyzeFocusAndEmotion(blendshapes);

          if (results.faceLandmarks) {
            for (const landmarks of results.faceLandmarks) {
              for (const landmark of landmarks) {
                ctx.beginPath();
                ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 1, 0, 2 * Math.PI);
                ctx.fillStyle = "rgba(16, 185, 129, 0.4)";
                ctx.fill();
              }
            }
          }
        } else {
          setFaceDetected(false);
          setAlerts((prev) => ({ ...prev, lookAway: "No face detected!" }));
          setCurrentEmotion("Unknown");
        }
      }
      requestRef.current = requestAnimationFrame(renderLoop);
    };
    renderLoop();
  };

  const analyzeFocusAndEmotion = (categories: any[]) => {
    const getScore = (name: string) => categories.find((c) => c.categoryName === name)?.score || 0;

    // 1. Eye Tracking
    const lookLeft = getScore("eyeLookOutRight") + getScore("eyeLookInLeft");
    const lookRight = getScore("eyeLookOutLeft") + getScore("eyeLookInRight");
    const lookUp = getScore("eyeLookUpLeft") + getScore("eyeLookUpRight");
    const lookDown = getScore("eyeLookDownLeft") + getScore("eyeLookDownRight");

    let lookAlert = null;
    const EYE_THRESHOLD = 0.8;

    if (lookLeft > EYE_THRESHOLD) lookAlert = "Looking Left - Maintain eye contact";
    else if (lookRight > EYE_THRESHOLD) lookAlert = "Looking Right - Maintain eye contact";
    else if (lookUp > EYE_THRESHOLD) lookAlert = "Looking Up - Maintain eye contact";
    else if (lookDown > EYE_THRESHOLD) lookAlert = "Looking Down - Maintain eye contact";

    // 2. Emotion Recognition
    const browInnerUp = getScore("browInnerUp");
    const mouthFrownL = getScore("mouthFrownLeft");
    const mouthFrownR = getScore("mouthFrownRight");
    const browDownL = getScore("browDownLeft");
    const browDownR = getScore("browDownRight");
    const mouthSmileL = getScore("mouthSmileLeft");
    const mouthSmileR = getScore("mouthSmileRight");
    const jawOpen = getScore("jawOpen");
    const mouthPressL = getScore("mouthPressLeft");

    let emotionAlert = null;
    let emotionDetected = "Neutral";

    if (mouthSmileL > 0.5 || mouthSmileR > 0.5) {
      emotionDetected = "Happy / Confident";
    } else if (browInnerUp > 0.4 && (mouthFrownL > 0.4 || mouthFrownR > 0.4)) {
      emotionDetected = "Sad / Nervous";
      emotionAlert = "Stay calm and confident. You seem nervous.";
    } else if (browDownL > 0.5 && browDownR > 0.5 && mouthPressL > 0.3) {
      emotionDetected = "Frustrated / Angry";
      emotionAlert = "Keep your tone relaxed and calm.";
    } else if (jawOpen > 0.3 && browInnerUp > 0.5) {
      emotionDetected = "Surprised";
    } else if (browDownL > 0.4 && browDownR > 0.4) {
      emotionDetected = "Thinking / Tense";
      emotionAlert = "Relax your facial muscles.";
    }

    setCurrentEmotion(emotionDetected);
    setAlerts((prev) => ({ ...prev, lookAway: lookAlert, emotion: emotionAlert }));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8 font-sans relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto z-10 relative">
        <header className="mb-8 border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent inline-block mb-2">
            Advanced Interview Telemetry
          </h1>
          <p className="text-zinc-400">
            Real-time biometric monitoring: Eye Tracking, Emotion Recognition, Tone/Pitch, and Speech Clarity.
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Main Camera Feed */}
          <div className="xl:col-span-8 space-y-6">
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-black shadow-2xl aspect-video">
              {!isModelLoaded && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-sm">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="font-medium text-emerald-400">Initializing Biometric Models...</p>
                </div>
              )}

              <video
                ref={videoRef}
                className="w-full h-full object-cover transform scale-x-[-1]"
                autoPlay
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none transform scale-x-[-1]"
              />

              {/* HUD Overlays */}
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                 <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-zinc-700/50 text-xs font-semibold tracking-wider text-zinc-300">
                   FPS: {faceDetected ? "30" : "0"}
                 </div>
              </div>

              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <div
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    faceDetected
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}
                >
                  {faceDetected ? "● TRACKING ACTIVE" : "○ NO FACE"}
                </div>
              </div>
              
              <div className="absolute bottom-4 left-4 right-4 z-10">
                 {/* Live Warning Banner */}
                 {(alerts.lookAway || alerts.emotion || alerts.speech) && (
                   <div className="w-full bg-black/60 backdrop-blur-xl border border-red-500/30 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-center animate-in fade-in slide-in-from-bottom-5">
                      {alerts.lookAway && <div className="text-red-400 font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> {alerts.lookAway}</div>}
                      {alerts.emotion && <div className="text-amber-400 font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> {alerts.emotion}</div>}
                      {alerts.speech && <div className="text-blue-400 font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> {alerts.speech}</div>}
                   </div>
                 )}
              </div>
            </div>

            {/* Audio waveform / volume visualizer */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
               <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Vocal Consistency Monitor</h3>
               <div className="flex items-end gap-1 h-16 w-full opacity-80">
                  {Array.from({length: 40}).map((_, i) => (
                    <div key={i} className="flex-1 rounded-t-sm transition-all duration-75" style={{ 
                        backgroundColor: volume > (i * 1.5) ? '#10b981' : '#27272a',
                        height: volume > (i * 1.5) ? `${Math.min(100, Math.max(10, volume * (1 + Math.random() * 0.5)))}%` : '10%' 
                    }}></div>
                  ))}
               </div>
            </div>
          </div>

          {/* Right Column Metrics */}
          <div className="xl:col-span-4 space-y-4">
            
            {/* 1. Eye Contact */}
            <div className={`bg-zinc-900/60 backdrop-blur-xl border rounded-2xl p-5 transition-all ${alerts.lookAway ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-zinc-800'}`}>
               <div className="flex items-center justify-between mb-2">
                 <h2 className="text-zinc-300 font-semibold flex items-center gap-2">
                   <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                   Eye Contact Focus
                 </h2>
                 <span className={`text-xs px-2 py-1 rounded-md ${alerts.lookAway ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {alerts.lookAway ? 'Distracted' : 'Focused'}
                 </span>
               </div>
               <div className="text-2xl font-bold mt-2">
                  {alerts.lookAway ? <span className="text-red-400 font-medium text-sm">{alerts.lookAway}</span> : <span className="text-emerald-400">Locked on screen</span>}
               </div>
            </div>

            {/* 2. Emotion Recognition */}
            <div className={`bg-zinc-900/60 backdrop-blur-xl border rounded-2xl p-5 transition-all ${alerts.emotion ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-zinc-800'}`}>
               <div className="flex items-center justify-between mb-2">
                 <h2 className="text-zinc-300 font-semibold flex items-center gap-2">
                   <svg className="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   Facial Expression
                 </h2>
               </div>
               <div className="text-2xl font-bold mt-2 text-white">
                  {currentEmotion}
               </div>
               <div className="text-sm text-zinc-500 mt-1">Real-time micro-expression analysis</div>
            </div>

            {/* 3. Tone & Pitch */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-5">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-zinc-300 font-semibold flex items-center gap-2">
                   <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm12-3c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zM9 10l12-3" /></svg>
                   Tone & Pitch Detection
                 </h2>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-black/50 p-3 rounded-lg border border-zinc-800">
                    <div className="text-xs text-zinc-500 mb-1">PITCH (Hz)</div>
                    <div className="text-xl font-bold text-zinc-200">{pitch > 0 ? pitch.toFixed(0) : '--'}</div>
                 </div>
                 <div className="bg-black/50 p-3 rounded-lg border border-zinc-800">
                    <div className="text-xs text-zinc-500 mb-1">VOLUME INTENSITY</div>
                    <div className="text-xl font-bold text-zinc-200">{volume > 0 ? volume.toFixed(1) : '--'}</div>
                 </div>
               </div>
            </div>

            {/* 4. Speech Clarity Data */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-5">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-zinc-300 font-semibold flex items-center gap-2">
                   <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                   Clarity & Confidence
                 </h2>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-black/50 p-3 rounded-lg border border-zinc-800 relative overflow-hidden">
                    <div className="text-xs text-zinc-500 mb-1">WORDS / MINUTE</div>
                    <div className={`text-2xl font-bold ${wpm > 170 || (wpm < 100 && wpm > 0) ? 'text-amber-400' : 'text-zinc-200'}`}>
                       {wpm > 0 ? wpm : '--'}
                    </div>
                    {wpm > 170 && <p className="text-[10px] text-amber-500 mt-1">Too Fast</p>}
                    {(wpm < 100 && wpm > 0) && <p className="text-[10px] text-amber-500 mt-1">Too Slow</p>}
                 </div>
                 <div className="bg-black/50 p-3 rounded-lg border border-zinc-800 relative overflow-hidden">
                    <div className="text-xs text-zinc-500 mb-1">FILLER WORDS</div>
                    <div className="text-2xl font-bold text-zinc-200">{fillerWords}</div>
                    <p className="text-[10px] text-zinc-600 mt-1">"um", "uh", "like"</p>
                 </div>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
