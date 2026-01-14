'use client'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { AIDoctorAgents } from '@/shared/list'
import { Loader2 } from 'lucide-react'

interface Session {
    id: number
    symptoms: string
    selectedDoctorId: number | null
    matchedDoctors: any[]
    status: string
    createdAt: string
}

export default function MedicalVoiceAgent() {
    const { sessionId } = useParams()
    const [inputText, setInputText] = useState('')
    const [isDictating, setIsDictating] = useState(false)
    const isDictatingRef = React.useRef(false) // Track dictation state for event handlers
    const [recognition, setRecognition] = useState<any>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isCallActive, setIsCallActive] = useState(false)
    const [callStatus, setCallStatus] = useState<string>('Not Connected')
    const [messages, setMessages] = useState<any[]>([])
    const [vapi, setVapi] = useState<any>(null)
    const [isMuted, setIsMuted] = useState(false)
    const resetIdleTimerRef = React.useRef<(() => void) | null>(null)

    // Sync Ref with State
    useEffect(() => {
        isDictatingRef.current = isDictating
    }, [isDictating])

    // Initialize Vapi
    useEffect(() => {
        const initVapi = async () => {
            // ... (rest of Vapi init)
            if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
                console.error("Missing NEXT_PUBLIC_VAPI_PUBLIC_KEY")
                setCallStatus('Config Error')
                return
            }

            const { default: Vapi } = await import('@vapi-ai/web')
            const vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!)
            setVapi(vapiInstance)

            let idleTimer: ReturnType<typeof setTimeout> | null = null
            let isTimeout = false

            const resetIdleTimer = () => {
                if (idleTimer) clearTimeout(idleTimer)
                idleTimer = setTimeout(() => {
                    console.log("Idle timeout reached. Ending call.")
                    isTimeout = true
                    // Add message when user goes offline due to inactivity
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: 'You went offline. If you want to continue chat, start consult again.',
                        stableContent: 'You went offline. If you want to continue chat, start consult again.'
                    }])
                    vapiInstance.stop()
                }, 120000) // 2 minutes
            }

            // Store reset function in ref so it can be accessed when user sends messages
            resetIdleTimerRef.current = resetIdleTimer

            const clearIdleTimer = () => {
                if (idleTimer) clearTimeout(idleTimer)
            }

            vapiInstance.on('call-start', () => {
                setIsCallActive(true)
                setCallStatus('Active')
                resetIdleTimer()
                // Mute Vapi immediately so it acts as output-only until we send text
                vapiInstance.setMuted(true)
                setIsMuted(true)
            })

            vapiInstance.on('call-end', () => {
                setIsCallActive(false)
                if (isTimeout) {
                    setCallStatus('Session Expired')
                    isTimeout = false
                } else {
                    setCallStatus('Ended')
                }
                clearIdleTimer()
            })

            // VAD events are disabled/ignored since we are using manual text/dictation input with Vapi muted.
            /* 
            vapiInstance.on('speech-start', () => {
                setCallStatus('Listening...') 
                clearIdleTimer()
            })

            vapiInstance.on('speech-end', () => {
                setCallStatus('Thinking...')
                resetIdleTimer()
            })
            */

            vapiInstance.on('message', (message: any) => {
                resetIdleTimer()

                if (message.type === 'transcript') {
                    setMessages(prev => {
                        const newMessages = [...prev]
                        const lastMessage = newMessages[newMessages.length - 1]

                        // Helper to ensure spaces between sentences
                        const appendText = (base: string, newText: string) => {
                            if (!base) return newText
                            if (base.endsWith(' ')) return base + newText
                            return base + ' ' + newText
                        }

                        if (message.transcriptType === 'partial') {
                            if (message.role === 'assistant') {
                                // AI started speaking, clear "Thinking..." status immediately
                                setCallStatus('Active')

                                if (lastMessage && lastMessage.role === message.role) {
                                    // Append current partial to the stable (committed) content of this turn
                                    const stable = lastMessage.stableContent || ""
                                    lastMessage.content = appendText(stable, message.transcript)
                                    return newMessages
                                } else {
                                    // New turn, just show the partial
                                    return [...prev, {
                                        role: message.role,
                                        content: message.transcript,
                                        stableContent: "" // Init stable content
                                    }]
                                }
                            }
                        }

                        if (message.transcriptType === 'final') {
                            if (message.role === 'assistant') {
                                if (lastMessage && lastMessage.role === message.role) {
                                    // Commit this sentence to stable content
                                    const currentStable = lastMessage.stableContent || ""
                                    const newStable = appendText(currentStable, message.transcript)

                                    lastMessage.stableContent = newStable
                                    lastMessage.content = newStable
                                    return newMessages
                                } else {
                                    // New turn that started with a final (short utterance?)
                                    return [...prev, {
                                        role: message.role,
                                        content: message.transcript,
                                        stableContent: message.transcript
                                    }]
                                }
                                setCallStatus('Active')
                            }
                        }

                        return prev
                    })
                }

                if (message.type === 'conversation-update') {
                    if (message.conversation && message.conversation.length > 0) {
                        // When recovering history, we assume it's all "stable"
                        const formattedConversation = message.conversation.map((msg: any) => ({
                            ...msg,
                            stableContent: msg.content
                        }))
                        setMessages(formattedConversation)
                    }
                }
            })

            vapiInstance.on('error', (e: any) => {
                const errorMsg = typeof e?.error?.message === 'string'
                    ? e.error.message
                    : typeof e === 'string'
                        ? e
                        : JSON.stringify(e)

                // Only handle "meeting ended" errors if it's due to timeout (user not responding)
                if (typeof errorMsg === 'string' && (errorMsg.includes("ejection") || errorMsg.includes("Meeting has ended"))) {
                    // Check if this was due to timeout (user inactivity)
                    if (isTimeout) {
                        // Message already added in timeout handler, just update status
                        console.log("Session ended due to inactivity:", errorMsg)
                        setCallStatus('Session Expired')
                        setIsCallActive(false)
                    } else {
                        // Meeting ended for other reasons, log but don't show error to user
                        console.log("Session ended:", errorMsg)
                        setCallStatus('Ended')
                        setIsCallActive(false)
                    }
                } else {
                    console.error('Vapi Error:', e)
                    setCallStatus('Error')
                }
                clearIdleTimer()
            })
        }
        initVapi()
    }, [])


    const recognitionRef = React.useRef<any>(null)

    // State to track if dictation SHOULD be active
    const shouldDictateRef = React.useRef(false) // Source of truth for event handlers

    // Helper to safely stop recognition
    const stopRecognition = () => {
        if (recognitionRef.current) {
            const reco = recognitionRef.current

            // INTENTIONAL: Unbind ALL handlers to prevent ANY further callbacks
            reco.onresult = null
            reco.onerror = null
            reco.onend = null

            try {
                reco.abort()
            } catch (e) {
                // Ignore errors during abort
            }
            recognitionRef.current = null
        }
    }

    // Helper to start recognition
    const startRecognition = () => {
        if (typeof window === 'undefined') return

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        if (!SpeechRecognition) {
            alert("Speech recognition not supported in this browser.")
            setIsDictating(false)
            shouldDictateRef.current = false
            return
        }

        // Always stop existing first
        stopRecognition()

        const reco = new SpeechRecognition()
        reco.continuous = false // We handle restart manually
        reco.interimResults = true

        recognitionRef.current = reco

        // EVENT HANDLERS
        reco.onresult = (event: any) => {
            // STRICT GUARD: If we shouldn't be dictating, ignore everything
            if (!shouldDictateRef.current) {
                stopRecognition()
                return
            }

            let finalTranscript = ''
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript
                }
            }

            if (finalTranscript) {
                setInputText(prev => {
                    // Double check inside the state update
                    if (!shouldDictateRef.current) return prev
                    return prev + ' ' + finalTranscript
                })
            }
        }

        reco.onerror = (event: any) => {
            if (event.error !== 'no-speech') {
                console.warn('Speech recognition error:', event.error)
            }
            // If error occurred, stop. If user wants to continue, they can toggle. 
            // Or if it was just 'no-speech', onend handles restart if shouldDictateRef is true.
        }

        reco.onend = () => {
            // ONLY restart if text dictation is explicitly ON
            if (shouldDictateRef.current) {
                try {
                    reco.start()
                } catch (e) {
                    console.warn("Failed to restart recognition", e)
                    setIsDictating(false)
                    shouldDictateRef.current = false
                    stopRecognition()
                }
            } else {
                stopRecognition()
            }
        }

        try {
            reco.start()
        } catch (err) {
            console.error('Error starting recognition:', err)
            setIsDictating(false)
            shouldDictateRef.current = false
            stopRecognition()
        }
    }

    // Main Toggle Function
    const toggleDictation = () => {
        const nextState = !isDictating
        setIsDictating(nextState)
        shouldDictateRef.current = nextState // Sync Ref IMMEDIATELY

        if (nextState) {
            startRecognition()
        } else {
            stopRecognition()
        }
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            shouldDictateRef.current = false
            stopRecognition()
        }
    }, [])

    // Ensure state stays in sync if something else changes it (improbable but safe)
    useEffect(() => {
        if (!isDictating && shouldDictateRef.current) {
            shouldDictateRef.current = false
            stopRecognition()
        }
    }, [isDictating])

    const handleSend = () => {
        if (!inputText.trim() || !vapi) return

        setCallStatus('Thinking...')

        // Reset idle timer when user sends a message
        if (resetIdleTimerRef.current) {
            resetIdleTimerRef.current()
        }

        // Add user message to UI immediately for better responsiveness
        setMessages(prev => [...prev, { role: 'user', content: inputText }])

        // Send to Vapi
        vapi.send({
            type: "add-message",
            message: {
                role: "user",
                content: inputText
            }
        })

        setInputText('')
    }

    useEffect(() => {
        const fetchSessionDetails = async () => {
            try {
                setIsLoading(true)
                const response = await fetch(`/api/sessions?id=${sessionId}`)

                if (!response.ok) {
                    throw new Error('Failed to fetch session details')
                }

                const data = await response.json()
                setSession(data.session)
            } catch (err: any) {
                console.error('Error fetching session:', err)
                setError(err.message)
            } finally {
                setIsLoading(false)
            }
        }

        if (sessionId) {
            fetchSessionDetails()
        }
    }, [sessionId])

    const startCall = async () => {
        if (!vapi || !session) return;

        try {
            setCallStatus('Connecting...')
            setError(null)

            // 1. Ensure Dictation is OFF to prevent conflicts
            if (shouldDictateRef.current) {
                toggleDictation()
            }
            stopRecognition()

            // 2. Pre-check Microphone Permissions
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true })
            } catch (micErr) {
                console.error("Microphone access denied or not found:", micErr)
                setCallStatus('Mic Error')
                alert("Please enable your microphone to start the consultation. The AI needs audio access to connect.")
                return
            }

            const selectedDoctor = AIDoctorAgents.find(d => d.id === session.selectedDoctorId)

            if (!selectedDoctor) {
                throw new Error("Doctor not found")
            }

            if (!process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID) {
                console.error("Missing NEXT_PUBLIC_VAPI_ASSISTANT_ID")
                setCallStatus('Config Error')
                return
            }

            console.log("Starting call with ID:", process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID)

            // Try with doctor-specific persona and first message
            try {
                await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!, {
                    firstMessage: `Hello, I am your ${selectedDoctor.specialist}. How can I help you with your symptoms today?`
                })
            } catch (err: any) {
                console.warn("Retrying call without overrides due to error:", err)
                // Fallback: Start without overrides if the first attempt fails
                await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!)
            }

        } catch (e: any) {
            console.error("Failed to start call", e)
            if (e.error) {
                console.error("Vapi Error Details:", JSON.stringify(e.error, null, 2))
                if (JSON.stringify(e.error).includes("Device")) {
                    setCallStatus('No Mic Found')
                    alert("No microphone detected. Please check your system settings.")
                    return
                }
            }
            setCallStatus("Connection Failed")
        }
    }

    const endCall = async () => {
        if (vapi) {
            vapi.stop()
        }

        try {
            setCallStatus('Analysing...') // Feedback to user that report is generating

            await fetch('/api/sessions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: session?.id,
                    status: 'completed',
                    transcript: messages
                })
            })

            setCallStatus('Completed')
        } catch (error) {
            console.error("Failed to save session:", error)
            setCallStatus('Ended')
        }
    }

    if (isLoading) {
        return (
            <div className='flex items-center justify-center min-h-[400px]'>
                <div className='text-center'>
                    <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4' />
                    <p className='text-gray-500'>Loading session details...</p>
                </div>
            </div>
        )
    }

    if (error || !session) {
        return (
            <div className='flex items-center justify-center min-h-[400px]'>
                <div className='text-center'>
                    <p className='text-red-500 font-semibold'>Error loading session</p>
                    <p className='text-gray-500 mt-2'>{error || 'Session not found'}</p>
                </div>
            </div>
        )
    }

    const selectedDoctor = session.selectedDoctorId
        ? AIDoctorAgents.find(d => d.id === session.selectedDoctorId)
        : null

    return (
        <div className='max-w-4xl mx-auto'>
            <div className='bg-white rounded-xl shadow-sm border p-6'>
                {/* Header */}
                <div className='flex items-center justify-between mb-6'>
                    <div>
                        <h1 className='text-2xl font-bold'>Medical Consultation</h1>
                        <p className='text-sm text-gray-500 mt-1'>
                            Session ID: {sessionId} • Status: <span className='capitalize'>{session.status}</span>
                        </p>
                    </div>
                    <div className='flex items-center gap-2'>
                        <div className={`h-3 w-3 rounded-full ${isCallActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                        <span className='text-sm text-gray-500'>{callStatus}</span>
                        {isCallActive && (
                            <button onClick={endCall} className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200">
                                End Call
                            </button>
                        )}
                    </div>
                </div>

                {/* Doctor Info */}
                {selectedDoctor && (
                    <div className='flex flex-col items-center mb-8'>
                        <div className={`relative ${isCallActive ? 'p-1 rounded-full border-4 border-green-100' : ''}`}>
                            <Image
                                src={selectedDoctor.image}
                                alt={selectedDoctor.specialist}
                                width={120}
                                height={120}
                                className='rounded-full object-cover'
                            />
                        </div>
                        <h2 className='text-xl font-bold mt-4'>{selectedDoctor.specialist}</h2>
                        <p className='text-gray-500 text-sm'>AI Medical Voice Agent</p>
                    </div>
                )}

                {/* Symptoms Section */}
                <div className='mb-6'>
                    <h3 className='font-semibold text-sm text-gray-500 mb-2'>Your Symptoms</h3>
                    <div className='bg-gray-50 rounded-lg p-4'>
                        <p className='text-gray-700'>{session.symptoms}</p>
                    </div>
                </div>

                {/* Chat Area / Visualizer */}
                <div className='border-t pt-6'>
                    <div className='space-y-4 mb-6 max-h-[400px] min-h-[200px] overflow-y-auto px-2'>
                        {messages.length === 0 && !isCallActive && (
                            <div className='text-center py-8 text-gray-500'>
                                <p>Start a call to speak with the doctor.</p>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                    }`}>
                                    <p className='text-sm font-medium mb-1 opacity-75 capitalize'>{msg.role}</p>
                                    <p>{msg.content}</p>
                                </div>
                            </div>
                        ))}

                        {callStatus === 'Thinking...' && (
                            <div className='flex items-center justify-center gap-1 py-4'>
                                <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]'></div>
                                <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]'></div>
                                <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
                                <span className="ml-2 text-sm text-gray-400">Thinking...</span>
                            </div>
                        )}
                    </div>

                    <div className='pt-4 border-t'>
                        {!isCallActive ? (
                            <div className='text-center'>
                                <button
                                    onClick={startCall}
                                    className='bg-black text-white px-8 py-3 rounded-full flex items-center gap-2 mx-auto hover:bg-gray-800 transition-all transform hover:scale-105 shadow-lg'
                                >
                                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                                    </svg>
                                    Start Consultation
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2 items-end">
                                <button
                                    onClick={endCall}
                                    className="p-3 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                    title="End Consultation"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" /><line x1="22" x2="2" y1="2" y2="22" /></svg>
                                </button>
                                <button
                                    onClick={toggleDictation}
                                    className={`p-3 rounded-full transition-colors ${isDictating ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    title={isDictating ? "Stop Dictation" : "Start Dictation"}
                                >
                                    {isDictating ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                    )}
                                </button>
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Type or dictate your message..."
                                    className="flex-1 bg-gray-50 border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-[50px] min-h-[50px] max-h-[100px]"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputText.trim()}
                                    className={`p-3 rounded-full transition-colors ${!inputText.trim() ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

