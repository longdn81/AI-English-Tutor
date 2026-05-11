import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, X, Keyboard, MoreVertical, Bot, Lightbulb, Sparkles, History, Loader2, AlertCircle, Volume2, Send, Award, Star, MessageSquare, BookOpen, VolumeX, Settings2, Trash2, XCircle, ChevronRight, Check } from 'lucide-react';
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
  const initialTopic = topicId
    ? topicId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'General Conversation';

  // ── State ──────────────────────────────────────────────
  const [localTopic, setLocalTopic] = useState(initialTopic);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greeting',
      role: 'ai',
      text: `Hello! Let's practice "${initialTopic}" together. Go ahead and speak whenever you're ready! 🎙️`,
      timestamp: new Date(),
    },
  ]);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'voice' | 'type'>('voice');
  const [textInput, setTextInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  // New features state
  const [isMuted, setIsMuted] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [showHintsModal, setShowHintsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [tempVoice, setTempVoice] = useState(localStorage.getItem('preferredVoice') || '');
  const [tempTempo, setTempTempo] = useState(localStorage.getItem('speechTempo') || 'Natural');

  // ── Speech Synthesis (AI Voice) ─────────────────────────
  useEffect(() => {
    // Pre-load voices
    const loadVoices = () => setAvailableVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    if (isMuted) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }
  }, [isMuted]);

  const speak = useCallback((text: string, messageId: string) => {
    if (isMuted) return;
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
      formData.append('topic', localTopic);

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
  }, [localTopic]);

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

  // ── Send text to backend ──────────────────────────────
  const sendTextToAPI = async () => {
    if (!textInput.trim() || isProcessing) return;
    const text = textInput.trim();
    setTextInput('');
    setIsProcessing(true);
    setError(null);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const formData = new FormData();
      formData.append('text_message', text);
      formData.append('topic', localTopic);

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Server error');

      if (data.has_error && data.corrected_text) {
        setMessages(prev => prev.map(m => m.id === userMessage.id ? {
          ...m,
          correction: { original: text, suggested: data.corrected_text, explanation: data.error_explanation || '' },
          upgrade: data.advanced_suggestions?.join(' • ')
        } : m));
      }

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: data.ai_response || 'No response.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      if (data.ai_response) speak(data.ai_response, aiMessage.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── End Session & Topic Change ────────────────────────
  const getTopicVocab = () => {
    const t = localTopic.toLowerCase();
    if (t.includes('cafe') || t.includes('coffee') || t.includes('order')) {
      return {
        title: 'Cafe & Ordering',
        phrases: ['"I would like to order..."', '"Can I get a..."', '"For here or to go?"', '"Decaf / Extra shot"', '"What do you recommend?"'],
        vocabulary: ['Barista', 'Espresso', 'Receipt', 'Pastry', 'Takeaway', 'Beverage']
      };
    }
    if (t.includes('interview') || t.includes('job') || t.includes('work')) {
      return {
        title: 'Job Interview',
        phrases: ['"My strengths are..."', '"I have experience in..."', '"I am a fast learner."', '"I handle pressure well."', '"What are the next steps?"'],
        vocabulary: ['Resume / CV', 'Qualifications', 'Salary', 'Requirements', 'Colleagues', 'Promotion']
      };
    }
    if (t.includes('airport') || t.includes('travel') || t.includes('flight')) {
      return {
        title: 'Airport & Travel',
        phrases: ['"Where is the check-in desk?"', '"Here is my boarding pass."', '"Is the flight delayed?"', '"Window or aisle seat?"', '"Where is baggage claim?"'],
        vocabulary: ['Luggage', 'Boarding pass', 'Gate', 'Security', 'Customs', 'Departure']
      };
    }
    if (t.includes('hobby') || t.includes('free time') || t.includes('interest')) {
      return {
        title: 'Hobbies & Interests',
        phrases: ['"In my free time, I enjoy..."', '"I am really into..."', '"It helps me relax."', '"I have been doing this for years."', '"Are you interested in...?"'],
        vocabulary: ['Leisure', 'Passion', 'Outdoor', 'Creative', 'Routine', 'Enthusiast']
      };
    }
    return {
      title: 'Common Conversations',
      phrases: ['"Speaking of which..."', '"That reminds me..."', '"On the other hand..."', '"To be honest..."', '"As far as I know..."'],
      vocabulary: ['Basically', 'Actually', 'Therefore', 'Furthermore', 'However', 'Meanwhile']
    };
  };

  const topicVocab = getTopicVocab();

  // ── Modals & Actions ──────────────────────────────────
  const confirmTopicChange = (topic: string) => {
    if (topic && topic.trim()) {
      setLocalTopic(topic.trim());
      setMessages([{
        id: `greeting-${Date.now()}`,
        role: 'ai',
        text: `Topic changed to "${topic.trim()}". Let's start! 🎙️`,
        timestamp: new Date()
      }]);
    }
    setShowTopicModal(false);
    setNewTopicInput('');
  };

  const saveVoiceSettings = () => {
    if (tempVoice) localStorage.setItem('preferredVoice', tempVoice);
    localStorage.setItem('speechTempo', tempTempo);
    setShowSettingsModal(false);
    
    // Play a preview sound
    const u = new SpeechSynthesisUtterance("Settings saved.");
    const v = availableVoices.find(v => v.name === tempVoice);
    if (v) u.voice = v;
    u.rate = { Relaxed: 0.85, Natural: 1.0, Fluent: 1.15 }[tempTempo as string] || 1.0;
    window.speechSynthesis.speak(u);
  };

  const handleEndSession = async () => {
    setIsSummarizing(true);
    setShowSummary(true);
    try {
      const response = await fetch(`${API_URL}/api/chat/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });
      const data = await response.json();
      setSummaryData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen relative bg-surface overflow-hidden">
      {/* Header */}
      <header className="px-6 py-6 lg:px-12 flex justify-between items-center flex-shrink-0 z-10 bg-surface/40 backdrop-blur-md">
        <div>
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-on-surface">
            {localTopic}
          </h2>
          <p className="text-sm text-on-surface-variant font-medium mt-1">Practicing casual ordering and small talk.</p>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="bg-surface-container hover:bg-surface-container-high text-on-surface-variant rounded-full p-3 transition-all border border-outline-variant/30 flex items-center justify-center shadow-sm">
            <MoreVertical size={20} />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-xl border border-outline-variant/30 overflow-hidden z-50 py-1">
                <button onClick={() => { setShowTopicModal(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-on-surface hover:bg-surface-container transition-colors">
                  <MessageSquare size={16} className="text-primary" /> Change Topic
                </button>
                <button onClick={() => { setShowHintsModal(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-on-surface hover:bg-surface-container transition-colors">
                  <BookOpen size={16} className="text-secondary" /> Topic Hints
                </button>
                <button onClick={() => { setIsMuted(!isMuted); setShowMenu(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-on-surface hover:bg-surface-container transition-colors">
                  {isMuted ? <Volume2 size={16} className="text-tertiary" /> : <VolumeX size={16} className="text-tertiary" />}
                  {isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
                </button>
                <button onClick={() => { setShowSettingsModal(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-on-surface hover:bg-surface-container transition-colors">
                  <Settings2 size={16} className="text-on-surface-variant" /> Voice Settings
                </button>
                <div className="h-px bg-outline-variant/10 my-1 mx-3" />
                <button onClick={() => { setMessages([]); setShowMenu(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-on-surface hover:bg-surface-container transition-colors">
                  <Trash2 size={16} className="text-on-surface-variant" /> Clear Chat
                </button>
                <button onClick={() => { handleEndSession(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-error hover:bg-error-container/20 transition-colors">
                  <XCircle size={16} /> End Session
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
          {inputMode === 'voice' ? (
            <>
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
                <button onClick={() => setInputMode('type')} className="flex flex-col items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors group">
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
                  onClick={handleEndSession}
                  className="flex flex-col items-center gap-1.5 text-on-surface-variant hover:text-error transition-colors group"
                >
                  <div className="p-3 rounded-full group-hover:bg-error/5">
                    <X size={24} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-tighter">End</span>
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center gap-4">
              <button onClick={() => setInputMode('voice')} className="p-3 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors" title="Switch to Voice Mode">
                <Mic size={24} />
              </button>
              <input 
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendTextToAPI()}
                placeholder="Type your message..."
                className="flex-1 bg-surface-container-low border border-outline-variant/50 rounded-full px-6 py-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button onClick={sendTextToAPI} disabled={isProcessing || !textInput.trim()} className="p-4 rounded-full bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-colors" title="Send Message">
                {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* End Session Summary Modal */}
      <AnimatePresence>
        {showSummary && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface-container-lowest w-full max-w-2xl rounded-[2.5rem] p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh] hide-scrollbar">
              {isSummarizing ? (
                <div className="flex flex-col items-center justify-center py-20 gap-6">
                  <Loader2 size={48} className="text-primary animate-spin" />
                  <p className="text-xl font-display font-bold text-on-surface">Evaluating your session...</p>
                </div>
              ) : summaryData ? (
                <div className="flex flex-col gap-6 md:gap-8">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-on-surface flex items-center gap-3">
                      <Award className="text-tertiary" size={32} /> Session Summary
                    </h2>
                    <div className="flex items-center gap-2 bg-tertiary-container/30 text-tertiary px-4 py-2 rounded-2xl font-bold text-xl border border-tertiary/20">
                      <Star size={20} className="fill-tertiary" /> {summaryData.overall_score}/10
                    </div>
                  </div>
                  
                  <div className="bg-surface-container-low p-5 md:p-6 rounded-3xl border border-outline-variant/30">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-on-surface-variant mb-2">Grammar & Syntax</h3>
                    <p className="text-on-surface leading-relaxed text-sm md:text-base">{summaryData.grammar_review}</p>
                  </div>
                  
                  {summaryData.pronunciation_review && (
                    <div className="bg-surface-container-low p-5 md:p-6 rounded-3xl border border-outline-variant/30">
                      <h3 className="font-bold text-sm uppercase tracking-widest text-on-surface-variant mb-2">Pronunciation & Fluency</h3>
                      <p className="text-on-surface leading-relaxed text-sm md:text-base">{summaryData.pronunciation_review}</p>
                    </div>
                  )}
                  
                  <div className="bg-surface-container-low p-5 md:p-6 rounded-3xl border border-outline-variant/30">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-on-surface-variant mb-2">Vocabulary Usage</h3>
                    <p className="text-on-surface leading-relaxed text-sm md:text-base">{summaryData.vocabulary_review}</p>
                  </div>
                  
                  <div className="bg-primary/10 p-5 md:p-6 rounded-3xl border border-primary/20 flex gap-4 items-start">
                    <Lightbulb className="text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-primary mb-1">Tutor's Note</h3>
                      <p className="text-on-surface leading-relaxed italic text-sm md:text-base">{summaryData.encouraging_message}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-4">
                    <button onClick={() => setShowSummary(false)} className="px-6 py-3 font-bold text-on-surface-variant hover:bg-surface-container rounded-2xl transition-colors">Close</button>
                    <button onClick={() => navigate('/speak')} className="px-6 py-3 font-bold bg-primary text-on-primary rounded-2xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">Done</button>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <p className="text-error font-bold">Failed to load summary.</p>
                  <button onClick={() => setShowSummary(false)} className="px-6 py-2 bg-surface-container rounded-xl font-bold">Close</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Topic Modal */}
      <AnimatePresence>
        {showTopicModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface-container-lowest w-full max-w-md rounded-[2rem] p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-2xl font-bold flex items-center gap-2"><MessageSquare className="text-primary"/> Change Topic</h3>
                <button onClick={() => setShowTopicModal(false)} className="text-on-surface-variant hover:bg-surface-container p-2 rounded-full"><X size={20}/></button>
              </div>
              <input 
                type="text" 
                placeholder="Type any topic (e.g. Travel, Movies...)" 
                value={newTopicInput} 
                onChange={e => setNewTopicInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmTopicChange(newTopicInput)}
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-5 py-4 text-on-surface focus:ring-2 focus:ring-primary mb-6"
                autoFocus
              />
              <p className="text-sm font-bold text-on-surface-variant mb-3 uppercase tracking-widest">Or choose a suggestion</p>
              <div className="flex flex-wrap gap-2 mb-8">
                {['Cafe & Ordering', 'Job Interview', 'Airport Check-in', 'Small Talk', 'Hobbies & Interests'].map(t => (
                  <button key={t} onClick={() => confirmTopicChange(t)} className="bg-surface-container hover:bg-surface-container-high px-4 py-2 rounded-lg text-sm font-medium border border-outline-variant/30 transition-colors">{t}</button>
                ))}
              </div>
              <button onClick={() => confirmTopicChange(newTopicInput)} disabled={!newTopicInput.trim()} className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20">Let's Talk</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Topic Hints Modal */}
      <AnimatePresence>
        {showHintsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface-container-lowest w-full max-w-lg rounded-[2rem] p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-2xl font-bold flex items-center gap-2"><BookOpen className="text-secondary"/> Helpful Phrases</h3>
                <button onClick={() => setShowHintsModal(false)} className="text-on-surface-variant hover:bg-surface-container p-2 rounded-full"><X size={20}/></button>
              </div>
              <p className="text-on-surface-variant mb-6">Here are some general phrases to help you keep the conversation flowing smoothly.</p>
              
              <div className="bg-surface-container border border-outline-variant/30 p-5 rounded-2xl mb-6">
                <h4 className="font-bold text-primary mb-4 flex items-center gap-2 border-b border-outline-variant/20 pb-3">
                  <Sparkles size={18} /> {topicVocab.title} Context
                </h4>
                
                <div className="mb-4">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-2">Key Vocabulary</h5>
                  <div className="flex flex-wrap gap-2">
                    {topicVocab.vocabulary.map((w, i) => (
                      <span key={i} className="bg-surface-container-highest px-3 py-1.5 rounded-lg text-sm text-on-surface font-medium border border-outline-variant/30">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-2">Useful Phrases</h5>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-sm text-on-surface font-medium">
                    {topicVocab.phrases.map((w, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50 flex-shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-secondary-container/10 border border-secondary/20 p-4 rounded-2xl">
                  <h4 className="font-bold text-secondary mb-2">Expressing Opinion</h4>
                  <ul className="list-disc list-inside text-sm text-on-surface space-y-1">
                    <li>"In my opinion..."</li>
                    <li>"From my perspective..."</li>
                    <li>"I honestly believe that..."</li>
                  </ul>
                </div>
                <div className="bg-tertiary-container/10 border border-tertiary/20 p-4 rounded-2xl">
                  <h4 className="font-bold text-tertiary mb-2">Asking for Clarification</h4>
                  <ul className="list-disc list-inside text-sm text-on-surface space-y-1">
                    <li>"Could you elaborate on that?"</li>
                    <li>"What exactly do you mean by..."</li>
                    <li>"I didn't quite catch that. Could you repeat?"</li>
                  </ul>
                </div>
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl">
                  <h4 className="font-bold text-primary mb-2">Showing Agreement</h4>
                  <ul className="list-disc list-inside text-sm text-on-surface space-y-1">
                    <li>"I completely agree with you."</li>
                    <li>"That's exactly how I feel."</li>
                    <li>"You make a valid point."</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Voice Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface-container-lowest w-full max-w-md rounded-[2rem] p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-2xl font-bold flex items-center gap-2"><Settings2 className="text-primary"/> Quick Voice Settings</h3>
                <button onClick={() => setShowSettingsModal(false)} className="text-on-surface-variant hover:bg-surface-container p-2 rounded-full"><X size={20}/></button>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-2">Select Voice</label>
                <div className="relative">
                  <select 
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface appearance-none focus:ring-2 focus:ring-primary"
                    value={tempVoice}
                    onChange={(e) => setTempVoice(e.target.value)}
                  >
                    <option value="">System Default</option>
                    {availableVoices.filter(v => v.lang.startsWith('en')).map((v, i) => (
                      <option key={i} value={v.name}>{v.name} ({v.lang})</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-4 top-3.5 text-on-surface-variant rotate-90 pointer-events-none" size={18} />
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-2">Speaking Speed</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Relaxed', 'Natural', 'Fluent'].map(t => (
                    <button
                      key={t}
                      onClick={() => setTempTempo(t)}
                      className={`py-3 rounded-xl border font-medium text-sm transition-all ${tempTempo === t ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'}`}
                    >
                      {tempTempo === t && <Check size={14} className="inline mr-1" />} {t}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={saveVoiceSettings} className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">Save Settings</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
