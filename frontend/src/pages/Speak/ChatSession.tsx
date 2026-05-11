import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, X, Keyboard, MoreVertical, Bot, Lightbulb, Sparkles, CheckCircle2, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
  correction?: {
    original: string;
    suggested: string;
    parts: { text: string; isError?: boolean }[];
  };
  upgrade?: string;
  timestamp: Date;
}

export default function ChatSession() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      text: 'Hello! Welcome to the virtual cafe. What can I get for you today?',
      timestamp: new Date(),
    },
    {
      id: '2',
      role: 'user',
      text: 'I want an coffee with milks, please.',
      correction: {
        original: 'I want an coffee with milks, please.',
        suggested: 'I would like a coffee with milk',
        parts: [
          { text: 'I want ' },
          { text: 'an coffee', isError: true },
          { text: ' with ' },
          { text: 'milks', isError: true },
          { text: ', please.' },
        ],
      },
      timestamp: new Date(),
    },
    {
      id: '3',
      role: 'ai',
      text: 'Sure thing, a coffee with milk. Would you like that hot or iced? And what size?',
      timestamp: new Date(),
    },
    {
      id: '4',
      role: 'user',
      text: 'Hot, and a big one.',
      upgrade: 'A large hot coffee, please.',
      timestamp: new Date(),
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  return (
    <div className="flex flex-col h-screen relative bg-surface overflow-hidden">
      {/* Header */}
      <header className="px-6 py-6 lg:px-12 flex justify-between items-center flex-shrink-0 z-10 bg-surface/40 backdrop-blur-md">
        <div>
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-on-surface">
            {topicId ? topicId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Conversation'}
          </h2>
          <p className="text-sm text-on-surface-variant font-medium mt-1">Practicing casual ordering and small talk.</p>
        </div>
        <button className="bg-surface-container hover:bg-surface-container-high text-on-surface-variant rounded-full p-3 transition-all border border-outline-variant/30 flex items-center justify-center shadow-sm">
          <MoreVertical size={20} />
        </button>
      </header>

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
                <div className={`rounded-[1.5rem] px-6 py-4 shadow-sm border ${
                  msg.role === 'user' 
                    ? 'bg-primary text-on-primary rounded-tr-sm border-primary shadow-primary/10' 
                    : 'bg-surface-container-lowest text-on-surface rounded-tl-sm border-outline-variant/20'
                }`}>
                  <p className="text-body-md leading-relaxed">
                    {msg.correction && msg.role === 'user' ? (
                      <span className="relative">
                        {msg.correction.parts.map((part, i) => (
                          <span key={i} className={part.isError ? 'bg-error-container/40 text-on-error-container px-1 -mx-1 rounded' : ''}>
                            {part.text}
                          </span>
                        ))}
                      </span>
                    ) : msg.text}
                  </p>
                </div>

                {/* Feedback Badges */}
                <AnimatePresence>
                  {msg.correction && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 bg-secondary-container/10 border border-secondary/20 rounded-xl px-4 py-2.5 mr-2"
                    >
                      <Lightbulb className="text-secondary" size={16} />
                      <p className="text-xs font-medium text-on-surface-variant">
                        <span className="font-bold text-secondary">Try:</span> "{msg.correction.suggested}"
                      </p>
                    </motion.div>
                  )}
                  {msg.upgrade && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 bg-tertiary-container/10 border border-tertiary/30 rounded-xl px-4 py-2.5 mr-2"
                    >
                      <Sparkles className="text-tertiary fill-tertiary/10" size={16} />
                      <p className="text-xs font-medium text-on-surface-variant">
                        <span className="font-bold text-tertiary">Upgrade:</span> "{msg.upgrade}"
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ))}

        {/* Waveform Visualization (Pseudo-active state) */}
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
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 scale-100 hover:scale-105 active:scale-95 ${
                isListening ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-primary'
              }`}
            >
              {isListening && (
                <motion.div 
                  layoutId="mic-glow"
                  className="absolute inset-0 bg-primary/20 rounded-full scale-150 blur-xl animate-pulse"
                />
              )}
              <Mic size={32} strokeWidth={isListening ? 2.5 : 1.5} className="relative z-10" />
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
