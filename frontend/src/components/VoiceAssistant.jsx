import React, { useState, useEffect, useRef } from 'react'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  Calendar, 
  User, 
  Clock, 
  AlertCircle,
  CornerDownRight,
  RefreshCw
} from 'lucide-react'
import { aiAPI } from '../services/api'

export default function VoiceAssistant({ onRefresh }) {
  const [isOpen, setIsOpen] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [status, setStatus] = useState('idle') // 'idle' | 'listening' | 'processing' | 'speaking' | 'error'
  const [transcript, setTranscript] = useState('')
  const [chatLog, setChatLog] = useState([
    {
      id: 1,
      role: 'bot',
      text: "Hi! I'm your AI Voice Scheduler. Click the microphone and say something like: 'Schedule an appointment with Dr. Jenkins next Tuesday' to book it hands-free!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  
  const [isMuted, setIsMuted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  const chatEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const synthRef = useRef(null)
  const currentUtteranceRef = useRef(null)

  // Scroll to bottom of chat logs
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatLog, transcript])

  // Initialize Speech Recognition & Synthesis
  useEffect(() => {
    // 1. Initialize STT SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.interimResults = true
      rec.lang = 'en-US'

      rec.onstart = () => {
        setIsListening(true)
        setStatus('listening')
        setTranscript('')
        setErrorMessage('')
      }

      rec.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }
        
        setTranscript(finalTranscript || interimTranscript)
      }

      rec.onerror = (event) => {
        console.error('Speech recognition error', event)
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access blocked. Please enable mic permissions in your browser.')
        } else {
          setErrorMessage(`Voice recognition failed: ${event.error}`)
        }
        setIsListening(false)
        setStatus('error')
      }

      rec.onend = () => {
        setIsListening(false)
        // If there is transcript text, send it to the backend immediately
        setTranscript(prev => {
          if (prev.trim()) {
            handleVoiceCommand(prev.trim())
          } else {
            setStatus('idle')
          }
          return ''
        })
      }

      recognitionRef.current = rec
    } else {
      setErrorMessage('Speech recognition is not supported in this browser. Try Google Chrome or Edge.')
    }

    // 2. Initialize TTS SpeechSynthesis
    if (window.speechSynthesis) {
      synthRef.current = window.speechSynthesis
    }
    
    return () => {
      // Clean up speaking and listening on unmount
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  // Start speech recognition
  const startListening = () => {
    // Cancel any ongoing bot speech first
    if (synthRef.current) {
      synthRef.current.cancel()
      setStatus('idle')
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
      } catch (err) {
        // Recognition already running or blocked
        console.error('Failed to start speech recognition', err)
      }
    }
  }

  // Stop speech recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  // Handle TTS bot speech response
  const speakText = (text) => {
    if (!synthRef.current || isMuted) return

    // Cancel existing speakings
    synthRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    
    // Attempt to pick a professional female/neutral English voice if available
    const voices = synthRef.current.getVoices()
    const preferredVoice = voices.find(v => 
      v.lang.startsWith('en-') && 
      (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira') || v.name.includes('Hazel'))
    )
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => {
      setStatus('speaking')
    }

    utterance.onend = () => {
      setStatus('idle')
    }

    utterance.onerror = (e) => {
      console.error('TTS execution failed:', e)
      setStatus('idle')
    }

    currentUtteranceRef.current = utterance
    synthRef.current.speak(utterance)
  }

  // Process voice text command through FastAPI NLP backend
  const handleVoiceCommand = async (commandText) => {
    setStatus('processing')
    
    // Add user message to chat log
    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: commandText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setChatLog(prev => [...prev, userMsg])

    try {
      // Call voice schedule backend API
      const result = await aiAPI.voiceSchedule(commandText)
      
      if (result.success) {
        const botMsg = {
          id: Date.now() + 1,
          role: 'bot',
          text: result.speech_response,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          followup: result.followup
        }
        setChatLog(prev => [...prev, botMsg])
        
        // Speak response out loud
        speakText(result.speech_response)
        
        // Trigger dashboard/data sync refresh
        if (onRefresh) {
          onRefresh()
        }
      } else {
        const errorMsg = {
          id: Date.now() + 1,
          role: 'bot',
          text: result.speech_response || "I ran into a problem scheduling that. Let's try again.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setChatLog(prev => [...prev, errorMsg])
        speakText(errorMsg.text)
        setStatus('idle')
      }
    } catch (err) {
      console.error(err)
      const botErr = {
        id: Date.now() + 1,
        role: 'bot',
        text: "I couldn't contact the scheduling agent. Please ensure the CRM backend server is running and try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setChatLog(prev => [...prev, botErr])
      speakText(botErr.text)
      setStatus('error')
    }
  }

  // Toggle Mute Speech Synthesis
  const toggleMute = (e) => {
    e.stopPropagation()
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    if (nextMuted && synthRef.current) {
      synthRef.current.cancel()
      setStatus('idle')
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* --- A. CLOSED ORB BUTTON STATE --- */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_35px_rgba(99,102,241,0.6)] focus:outline-none animate-pulse-indigo"
        >
          <div className="absolute inset-0.5 rounded-full bg-[#0A192F]/80 opacity-0 transition-opacity group-hover:opacity-10" />
          <Mic className="h-6 w-6 transition-transform group-hover:scale-110" />
          
          {/* Pulsing indicator tag */}
          <span className="absolute -top-10 right-0 scale-0 rounded-lg bg-[#111B35] border border-slate-800 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300 shadow-xl transition-all duration-200 group-hover:scale-100 whitespace-nowrap">
            ✨ Voice Scheduler
          </span>
        </button>
      )}

      {/* --- B. OPEN EXPANDED CHAT SCREEN STATE --- */}
      {isOpen && (
        <div className="w-[360px] h-[500px] glass-panel rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-indigo-500/20 flex flex-col overflow-hidden animate-fade-in">
          
          {/* Header Panel */}
          <div className="p-4 bg-gradient-to-r from-indigo-950/40 to-slate-900/40 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sparkles className="h-4 w-4 animate-spin-slow" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">AI Voice Assistant</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    status === 'listening' ? 'bg-red-500 animate-ping' :
                    status === 'processing' ? 'bg-amber-500 animate-pulse' :
                    status === 'speaking' ? 'bg-emerald-500 animate-pulse' :
                    'bg-indigo-500'
                  }`} />
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    {status === 'listening' ? 'Listening...' :
                     status === 'processing' ? 'Thinking...' :
                     status === 'speaking' ? 'Speaking...' :
                     'Scheduler Active'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                title={isMuted ? "Unmute Assistant" : "Mute Assistant"}
                className={`p-1.5 rounded-lg border transition-colors hover:bg-slate-800/40 ${
                  isMuted 
                    ? 'border-red-500/30 text-red-400 bg-red-500/5' 
                    : 'border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="m-3 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-[11px] text-red-400 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Conversational Chat Scroll Logs */}
          <div className="grow overflow-y-auto p-4 space-y-4">
            {chatLog.map((msg) => {
              const isUser = msg.role === 'user'
              return (
                <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}>
                  <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs font-normal shadow-sm leading-relaxed ${
                    isUser 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-[#111B35] border border-slate-800/80 text-slate-200 rounded-bl-none'
                  }`}>
                    <p className="whitespace-pre-line">{msg.text}</p>
                    
                    {/* Integrated Appointment Card inside Chat bubble */}
                    {!isUser && msg.followup && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 animate-fade-in text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-800/50 pb-1.5 mb-1.5">
                          <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Appointment Booked</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-100">{msg.followup.hcp?.name || 'Resolved HCP'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>Due: {new Date(msg.followup.due_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-start gap-1.5 text-slate-400 pt-1">
                          <CornerDownRight className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span>{msg.followup.description.replace('Voice Appointment: ', '')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 px-1">{msg.time}</span>
                </div>
              )
            })}
            
            {/* Live speech transcription display */}
            {isListening && transcript && (
              <div className="flex flex-col items-end space-y-1">
                <div className="bg-indigo-600/40 border border-indigo-500/20 text-indigo-200 max-w-[85%] rounded-2xl rounded-br-none p-3.5 text-xs italic">
                  <span>{transcript}...</span>
                </div>
              </div>
            )}

            {/* AI thinking/processing spinner bubble */}
            {status === 'processing' && (
              <div className="flex items-start">
                <div className="bg-[#111B35] border border-slate-800 rounded-2xl rounded-bl-none p-3.5 text-slate-400 max-w-[85%] flex items-center gap-2 text-xs italic">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                  <span>Scheduling appointment in database...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Interactive Equalizer Voice Waves or Pulsating mic controller */}
          <div className="p-5 bg-slate-900/30 border-t border-slate-800/80 flex flex-col items-center justify-center space-y-3">
            
            {/* Real-time HTML5 Equalizer Waveform Animation */}
            {status === 'listening' ? (
              <div className="flex items-center justify-center gap-1.5 h-6 mb-1">
                <span className="w-1 bg-red-500 rounded-full animate-bounce h-5" style={{ animationDelay: '0.1s' }} />
                <span className="w-1 bg-red-500 rounded-full animate-bounce h-3" style={{ animationDelay: '0.3s' }} />
                <span className="w-1 bg-red-500 rounded-full animate-bounce h-6" style={{ animationDelay: '0.5s' }} />
                <span className="w-1 bg-red-500 rounded-full animate-bounce h-4" style={{ animationDelay: '0.2s' }} />
                <span className="w-1 bg-red-500 rounded-full animate-bounce h-5" style={{ animationDelay: '0.4s' }} />
                <span className="w-1 bg-red-500 rounded-full animate-bounce h-3" style={{ animationDelay: '0.6s' }} />
              </div>
            ) : status === 'speaking' ? (
              <div className="flex items-center justify-center gap-1.5 h-6 mb-1">
                <span className="w-1 bg-emerald-500 rounded-full animate-pulse h-4" style={{ animationDuration: '0.8s' }} />
                <span className="w-1 bg-emerald-500 rounded-full animate-pulse h-2" style={{ animationDuration: '0.6s' }} />
                <span className="w-1 bg-emerald-500 rounded-full animate-pulse h-5" style={{ animationDuration: '1.0s' }} />
                <span className="w-1 bg-emerald-500 rounded-full animate-pulse h-3" style={{ animationDuration: '0.7s' }} />
                <span className="w-1 bg-emerald-500 rounded-full animate-pulse h-4" style={{ animationDuration: '0.9s' }} />
              </div>
            ) : (
              <div className="h-6 mb-1 text-[11px] text-slate-500 text-center font-medium">
                {status === 'processing' ? 'AI parser running extraction' : 'Tap microphone and speak command'}
              </div>
            )}

            {/* Mic trigger button */}
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={status === 'processing'}
              className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all focus:outline-none disabled:opacity-40 disabled:pointer-events-none hover:scale-105 ${
                isListening 
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]'
              }`}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            
            {/* Micro instructional hint */}
            <span className="text-[10px] text-slate-400 text-center select-none font-medium bg-[#111B35] px-3.5 py-1 rounded-full border border-slate-800">
              {isListening ? 'Click again to end and book' : '“Schedule Dr. Jenkins next Tuesday”'}
            </span>

          </div>

        </div>
      )}

    </div>
  )
}
