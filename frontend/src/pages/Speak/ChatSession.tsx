import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, X, Keyboard, MoreVertical, Bot, Lightbulb, Sparkles, History, Loader2, AlertCircle, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
  correction?: {
    original: string;
    suggested: string;
    explanation: string;
  };
  upgrade?: string;
  timestamp: Date;
}

const API_URL = 'http://localhost:8000';

export default function ChatSession() {
  const { topicId } = useParams();
  const navigate = useNavigate();

  // Derive a human-readable topic name from the URL slug
  const topicName = topicId
    ? topicId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'General Conversation';

  // ── State ──────────────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greeting',
      role: 'ai',
      text: `Hello! Let's practice "${topicName}" together. Go ahead and speak whenever you're ready! 🎙️`,
      timestamp: new Date(),
    },
  ]);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // ── Speech Synthesis (AI Voice) ─────────────────────────
  useEffect(() => {
    // Pre-load voices to avoid delay on first speak
    window.speechSynthesis.getVoices();
  }, []);

  const speak = useCallback((text: string, messageId: string) => {
    window.speechSynthesis.cancel();
    setSpeakingId(null);
    
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoiceName = localStorage.getItem('preferredVoice');
    const tempo = localStorage.getItem('speechTempo') || 'Natural';
    const rateMap: Record<string, number> = { Relaxed: 0.85, Natural: 1.0, Fluent: 1.15 };
    
    let selectedVoice = null;
    
    if (preferredVoiceName) {
      selectedVoice = voices.find(v => v.name === preferredVoiceName) || null;
    }
    
    if (!selectedVoice) {
      const preferredVoices = ['Google US English', 'Microsoft Aria', 'Samantha', 'Alex', 'Victoria'];
      for (const name of preferredVoices) {
        const match = voices.find(v => v.name.includes(name) && v.lang.startsWith('en'));
        if (match) {
          selectedVoice = match;
          break;
        }
      }
    }
    
    // Fallback to any en-US voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en')) || null;
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.lang = 'en-US';
    utterance.rate = rateMap[tempo] || 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setSpeakingId(messageId);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  }, []);

  // ── Refs ───────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-scroll when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  // Cleanup media stream and speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // ── Send audio to backend ─────────────────────────────
  const sendAudioToAPI = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'recording.webm');
      formData.append('topic', topicName);

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error (${response.status})`);
      }

      // Add the user's message (what they said)
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: data.original_text || 'Could not transcribe audio.',
        timestamp: new Date(),
      };

      // Attach correction if there were errors
      if (data.has_error && data.corrected_text) {
        userMessage.correction = {
          original: data.original_text,
          suggested: data.corrected_text,
          explanation: data.error_explanation || '',
        };
      }

      // Attach upgrade suggestions if available
      if (data.advanced_suggestions && data.advanced_suggestions.length > 0) {
        userMessage.upgrade = data.advanced_suggestions.join(' • ');
      }

      // Add AI response message
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: data.ai_response || 'I didn\'t quite catch that. Could you try again?',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage, aiMessage]);

      // Auto-play the AI response
      if (data.ai_response) {
        speak(data.ai_response, aiMessage.id);
      }
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err.message || 'Something went wrong. Please try again.');

      // Add an error message to chat so user sees feedback
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'ai',
          text: '⚠️ Sorry, I couldn\'t process that. Please check your connection and try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  }, [topicName]);

  // ── Start recording ───────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        // Send to backend
        sendAudioToAPI(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setError('Could not access microphone. Please grant permission and try again.');
    }
  }, [sendAudioToAPI]);

  // ── Stop recording ────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsListening(false);
  }, []);

  // ── Toggle ────────────────────────────────────────────
  const toggleListening = () => {
    if (isProcessing) return; // Don't allow while processing
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col h-screen relative bg-surface overflow-hidden">
      {/* Header */}
      <header className="px-6 py-6 lg:px-12 flex justify-between items-center flex-shrink-0 z-10 bg-surface/40 backdrop-blur-md">
        <div>
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-on-surface">
            {topicName}
          </h2>
          <p className="text-sm text-on-surface-variant font-medium mt-1">Practicing casual ordering and small talk.</p>
        </div>
        <button className="bg-surface-container hover:bg-surface-container-high text-on-surface-variant rounded-full p-3 transition-all border border-outline-variant/30 flex items-center justify-center shadow-sm">
          <MoreVertical size={20} />
        </button>
      </header>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-6 lg:mx-12 mb-2 flex items-center gap-3 bg-error-container/20 border border-error/30 text-on-error-container rounded-2xl px-5 py-3"
          >
            <AlertCircle size={18} className="text-error flex-shrink-0" />
            <p className="text-sm font-medium flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-error hover:text-on-error-container">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 lg:px-12 pb-48 pt-4 flex flex-col gap-8 hide-scrollbar scroll-smooth"
      >
        <div className="flex justify-center mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 bg-surface-container-low px-4 py-1 rounded-full border border-outline-variant/10">
            Session Started
          </span>
        </div>

        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex flex-col gap-3 group ${msg.role === 'user' ? 'items-end ml-12' : 'items-start mr-12'}`}
          >
            <div className={`flex gap-3 max-w-[90%] lg:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                msg.role === 'ai' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant'
              }`}>
                {msg.role === 'ai' ? <Bot size={20} className="fill-primary/10" /> : <History size={20} />}
              </div>
              
              <div className="flex flex-col gap-2">
                <div className={`group/msg flex items-center gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`rounded-[1.5rem] px-6 py-4 shadow-sm border ${
                    msg.role === 'user' 
                      ? 'bg-primary text-on-primary rounded-tr-sm border-primary shadow-primary/10' 
                      : 'bg-surface-container-lowest text-on-surface rounded-tl-sm border-outline-variant/20'
                  }`}>
                    <p className="text-body-md leading-relaxed">{msg.text}</p>
                  </div>
                  
                  {msg.role === 'ai' && (
                    <button
                      onClick={() => speak(msg.text, msg.id)}
                      className={`p-2 rounded-full transition-all flex-shrink-0 ${
                        speakingId === msg.id 
                          ? 'text-primary bg-primary/10 animate-pulse' 
                          : 'text-on-surface-variant hover:bg-surface-container-high opacity-0 group-hover/msg:opacity-100'
                      }`}
                      title="Play Audio"
                    >
                      <Volume2 size={18} />
                    </button>
                  )}
                </div>

                {/* Correction Feedback */}
                <AnimatePresence>
                  {msg.correction && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-1.5 bg-secondary-container/10 border border-secondary/20 rounded-xl px-4 py-2.5 mr-2"
                    >
                      <div className="flex items-center gap-2">
                        <Lightbulb className="text-secondary" size={16} />
                        <p className="text-xs font-medium text-on-surface-variant">
                          <span className="font-bold text-secondary">Try:</span> "{msg.correction.suggested}"
                        </p>
                      </div>
                      {msg.correction.explanation && (
                        <p className="text-xs text-on-surface-variant/80 ml-6">{msg.correction.explanation}</p>
                      )}
                    </motion.div>
                  )}
                  {msg.upgrade && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 bg-tertiary-container/10 border border-tertiary/30 rounded-xl px-4 py-2.5 mr-2"
                    >
                      <Sparkles className="text-tertiary fill-tertiary/10" size={16} />
                      <p className="text-xs font-medium text-on-surface-variant">
                        <span className="font-bold text-tertiary">Advanced:</span> {msg.upgrade}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ))}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-start mr-12 gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border bg-primary/5 border-primary/20 text-primary">
              <Bot size={20} className="fill-primary/10" />
            </div>
            <div className="rounded-[1.5rem] rounded-tl-sm px-6 py-4 shadow-sm border border-outline-variant/20 bg-surface-container-lowest">
              <div className="flex items-center gap-3">
                <Loader2 size={18} className="text-primary animate-spin" />
                <p className="text-sm text-on-surface-variant font-medium animate-pulse">Analyzing your speech...</p>
              </div>
            </div>
          </div>
        )}

        {/* Waveform Visualization (Active recording state) */}
        {isListening && (
          <div className="flex justify-center mb-12">
            <div className="bg-surface-container-low px-8 py-4 rounded-full border border-primary/10 shadow-sm flex items-center gap-1.5 h-12">
              {[0.2, 0.5, 0.8, 0.4, 0.9, 0.3, 0.6].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [12 * h, 36 * h, 12 * h] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                  className="w-1 bg-primary rounded-full"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Control Area */}
      <div className="absolute bottom-4 lg:bottom-12 left-0 w-full px-6 flex justify-center z-20">
        <div className="w-full max-w-lg lg:max-w-2xl bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/30 rounded-[3rem] p-6 shadow-2xl flex flex-col items-center gap-6">
          <AnimatePresence>
            {isListening && (
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-sm font-bold text-primary tracking-widest uppercase animate-pulse"
              >
                Listening...
              </motion.p>
            )}
            {isProcessing && (
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-sm font-bold text-on-surface-variant tracking-widest uppercase"
              >
                Processing...
              </motion.p>
            )}
          </AnimatePresence>

          <div className="w-full flex items-center justify-between px-4 lg:px-12">
            <button className="flex flex-col items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors group">
              <div className="p-3 rounded-full group-hover:bg-primary/5">
                <Keyboard size={24} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">Type</span>
            </button>

            <button 
              onClick={toggleListening}
              disabled={isProcessing}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 scale-100 hover:scale-105 active:scale-95 ${
                isProcessing
                  ? 'bg-surface-container-low text-on-surface-variant cursor-not-allowed opacity-60'
                  : isListening
                    ? 'bg-error text-on-primary'
                    : 'bg-surface-container-low text-primary'
              }`}
            >
              {isListening && (
                <motion.div 
                  layoutId="mic-glow"
                  className="absolute inset-0 bg-error/20 rounded-full scale-150 blur-xl animate-pulse"
                />
              )}
              {isProcessing ? (
                <Loader2 size={32} className="animate-spin relative z-10" />
              ) : (
                <Mic size={32} strokeWidth={isListening ? 2.5 : 1.5} className="relative z-10" />
              )}
            </button>

            <button 
              onClick={() => navigate('/speak')}
              className="flex flex-col items-center gap-1.5 text-on-surface-variant hover:text-error transition-colors group"
            >
              <div className="p-3 rounded-full group-hover:bg-error/5">
                <X size={24} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">End</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
