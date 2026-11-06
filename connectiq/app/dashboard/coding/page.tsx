'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Code, CheckCircle, RotateCcw, Cpu } from 'lucide-react'

// Simple mock code editor
export default function CodingInterviewPage() {
  const [code, setCode] = useState(`function twoSum(nums, target) {
  // Write your solution here
  
}`)
  const [output, setOutput] = useState('')
  const [aiAnalysis, setAiAnalysis] = useState('Waiting for code execution...')

  const runCode = () => {
    // Mock execution
    setOutput('Running test cases...\nTest Case 1: [2, 7, 11, 15], 9 -> PASS\nTest Case 2: [3, 2, 4], 6 -> PASS\n\nResult: Success')
    setAiAnalysis('Logic is sound. Efficient use of hash map logic detected. Consider edge cases for empty arrays.')
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold flex items-center gap-2">
             <Code className="w-6 h-6 text-primary" />
             Technical Round: Two Sum
           </h1>
           <p className="text-sm text-muted-foreground">Difficulty: Easy • Time Remaining: 14:30</p>
         </div>
         <div className="flex items-center gap-2">
           <button 
             onClick={() => setCode(`function twoSum(nums, target) {\n  // Reset state\n}`)}
             className="p-2 hover:bg-secondary rounded-lg transition-colors"
           >
             <RotateCcw className="w-5 h-5 text-muted-foreground" />
           </button>
           <button 
             onClick={runCode}
             className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
           >
             <Play className="w-4 h-4 fill-current" />
             Run Code
           </button>
         </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Editor */}
        <div className="flex-1 bg-[#1e1e1e] rounded-xl border border-border/50 overflow-hidden flex flex-col font-mono text-sm">
          <div className="bg-[#2d2d2d] px-4 py-2 text-gray-400 text-xs flex justify-between">
            <span>main.js</span>
            <span>JavaScript</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 bg-transparent text-gray-300 p-4 resize-none focus:outline-none"
            spellCheck="false"
          />
        </div>

        {/* Sidebar: Output & AI Assistant */}
        <div className="w-80 flex flex-col gap-4">
          {/* Output Console */}
          <div className="flex-1 bg-black rounded-xl border border-border/50 p-4 font-mono text-sm overflow-y-auto">
            <h3 className="text-gray-500 text-xs uppercase mb-2">Console Output</h3>
            <pre className="text-green-400 whitespace-pre-wrap">{output || 'Ready to execute...'}</pre>
          </div>

          {/* AI Feedback */}
          <div className="h-1/3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
             <h3 className="text-blue-400 text-xs uppercase font-bold mb-2 flex items-center gap-2">
               <Cpu className="w-4 h-4" />
               AI Copilot Analysis
             </h3>
             <p className="text-sm text-blue-200/80 leading-relaxed">
               {aiAnalysis}
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
