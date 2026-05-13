import { useState, useEffect, useMemo } from 'react';
import { Clock, SpellCheck, TrendingUp, Play, AlertCircle, Lightbulb, CheckCircle2, X, Volume2, Loader2, StopCircle, Filter, Sparkles, BookOpen, FileEdit, Unlock, Mic2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function HistoryPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter States
  const [filterDate, setFilterDate] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/history/dashboard/${encodeURIComponent(user?.email || '')}`);
      const data = await res.json();
      if (data.feed) {
        setLogs(data.feed);
      }
      if (data.insight) {
        setInsight(data.insight);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Date Filter
      if (filterDate !== 'all') {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
        
        if (filterDate === 'today' && logDate.toDateString() !== now.toDateString()) return false;
        if (filterDate === '7days' && diffDays > 7) return false;
        if (filterDate === '30days' && diffDays > 30) return false;
      }

      // Topic Filter
      const topic = log.topic || "General";
      if (filterTopic !== 'all' && topic !== filterTopic) return false;

      // Tag Filter
      const ai = log.ai_result || {};
      const hasError = ai.has_error;
      const hasSuggestions = ai.advanced_suggestions && ai.advanced_suggestions.length > 0;
      
      if (filterTag === 'error' && !hasError) return false;
      if (filterTag === 'perfect' && hasError) return false;
      if (filterTag === 'vocab' && !hasSuggestions) return false;

      return true;
    });
  }, [logs, filterDate, filterTopic, filterTag]);

  // Derived Stats based on filteredLogs
  const statsData = useMemo(() => {
    const total_sessions = filteredLogs.length;
    const total_errors = filteredLogs.filter(c => c.ai_result?.has_error).length;
    return { total_sessions, total_errors };
  }, [filteredLogs]);

  // Chart Data based on filteredLogs
  const chartData = useMemo(() => {
    const cData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      cData.push({ name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count: 0 });
    }
    filteredLogs.forEach((conv: any) => {
      if (conv.timestamp) {
        const dateStr = new Date(conv.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const target = cData.find(item => item.name === dateStr);
        if (target) target.count += 1;
      }
    });
    return cData;
  }, [filteredLogs]);

  // Unique topics for dropdown
  const uniqueTopics = useMemo(() => {
    const topics = new Set(logs.map(log => log.topic || "General"));
    return Array.from(topics);
  }, [logs]);

  const playAudio = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const savedVoice = localStorage.getItem('preferredVoice');
    if (savedVoice) {
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find(v => v.name === savedVoice);
      if (v) utterance.voice = v;
    }
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopAudio = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const closeModal = () => {
    stopAudio();
    setShowModal(false);
    setSelectedSession(null);
  };

  const stats = [
    { icon: Clock, color: 'text-primary', label: 'Filtered Interactions', value: statsData.total_sessions.toString(), sub: 'turns' },
    { icon: SpellCheck, color: 'text-secondary', label: 'Errors Corrected', value: statsData.total_errors.toString(), sub: 'improvements' },
  ];

  return (
    <div className="w-full max-w-[1120px] mx-auto px-4 lg:px-16 py-12 flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-4xl lg:text-5xl font-bold text-on-surface">My Journey</h1>
        <p className="text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
          Track your progress and review past conversations.
        </p>
      </header>

      {/* AI Insight Banner */}
      {insight && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-container/60 to-tertiary-container/60 rounded-3xl p-6 lg:p-8 shadow-sm border border-primary/20 flex flex-col md:flex-row gap-4 lg:gap-6 items-start"
        >
          <div className="bg-white/60 p-3 rounded-2xl text-primary shadow-sm flex-shrink-0">
            <Sparkles size={28} />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">AI Tutor Insight</h3>
            <p className="text-on-surface text-lg font-medium leading-relaxed">{insight}</p>
          </div>
        </motion.div>
      )}

      {/* Progress Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/20 flex flex-col h-full"
          >
            <div className="flex items-center gap-3 mb-6 text-on-surface-variant">
              <stat.icon className={stat.color} size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="font-display text-5xl font-bold text-on-surface">{stat.value}</span>
              <span className="text-sm text-on-surface-variant font-medium">{stat.sub}</span>
            </div>
          </motion.div>
        ))}

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/20 flex flex-col md:col-span-1"
        >
          <div className="flex items-center gap-3 mb-6 text-on-surface-variant">
            <TrendingUp className="text-tertiary" size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Interaction Trend</span>
          </div>
          <div className="mt-auto h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1a1a1a', marginBottom: '4px' }}
                />
                <Bar dataKey="count" fill="currentColor" className="text-primary opacity-80 hover:opacity-100 transition-opacity" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Filters Section */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-on-surface-variant font-bold uppercase tracking-widest text-xs mr-4">
          <Filter size={16} /> Filters
        </div>
        
        <select 
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-full md:w-auto bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
        </select>

        <select 
          value={filterTopic}
          onChange={(e) => setFilterTopic(e.target.value)}
          className="w-full md:w-auto bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="all">All Topics</option>
          {uniqueTopics.map((t, i) => (
            <option key={i} value={t}>{t}</option>
          ))}
        </select>

        <select 
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          className="w-full md:w-auto bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="all">All Tags</option>
          <option value="error">Needs Correction</option>
          <option value="perfect">Perfect Grammar</option>
          <option value="vocab">Vocab Upgrade</option>
        </select>
      </div>

      {/* Conversation Logs */}
      <section className="flex flex-col gap-6">
        <h2 className="font-display text-2xl font-bold text-on-surface">Recent Conversations</h2>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-on-surface-variant font-medium">Loading history...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-[2rem] p-12 text-center border border-outline-variant/20">
            <p className="text-on-surface-variant">No conversations found matching your filters.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredLogs.map((log, i) => {
              const date = new Date(log.timestamp || log.created_at || log.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
              
              if (log.type === "progress") {
                if (log.sub_category === "grammar_quiz" || log.sub_category === "grammar") {
                  const isMastered = log.status === "mastered";
                  return (
                    <motion.div 
                      key={log._id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * Math.min(i, 10) }}
                      className="bg-surface-container-lowest rounded-[2rem] p-8 lg:p-10 shadow-sm border border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] bg-surface-container-low px-3 py-1 rounded-full outline outline-1 outline-outline-variant/30">
                            {date}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                            <FileEdit size={12} /> Grammar Quiz
                          </span>
                        </div>
                        <h3 className="font-display text-2xl font-bold text-on-surface mb-3">{log.item_id || "Topic"}</h3>
                        <div className="flex items-center gap-4">
                          <div className="text-xl font-bold text-on-surface-variant">
                            Score: <span className={isMastered ? "text-primary" : "text-secondary"}>{log.score || 0}/5</span>
                          </div>
                          {isMastered && (
                            <div className="flex items-center gap-1 text-tertiary font-bold text-sm">
                              <CheckCircle2 size={16} /> Mastered
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                if (log.sub_category === "vocabulary" || log.sub_category === "vocab") {
                  return (
                    <motion.div 
                      key={log._id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * Math.min(i, 10) }}
                      className="bg-surface-container-lowest rounded-[2rem] p-8 lg:p-10 shadow-sm border border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] bg-surface-container-low px-3 py-1 rounded-full outline outline-1 outline-outline-variant/30">
                            {date}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full">
                            <BookOpen size={12} /> Vocabulary Set
                          </span>
                        </div>
                        <h3 className="font-display text-2xl font-bold text-on-surface mb-3">{log.item_id || "Set"}</h3>
                        <div className="flex items-center gap-2 text-tertiary font-bold">
                          <Unlock size={18} /> Unlocked & Completed
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                if (log.sub_category === "phrases") {
                  return (
                    <motion.div 
                      key={log._id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * Math.min(i, 10) }}
                      className="bg-surface-container-lowest rounded-[2rem] p-8 lg:p-10 shadow-sm border border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] bg-surface-container-low px-3 py-1 rounded-full outline outline-1 outline-outline-variant/30">
                            {date}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-bold text-tertiary bg-tertiary/10 px-3 py-1 rounded-full">
                            <Sparkles size={12} /> Topic Phrases
                          </span>
                        </div>
                        <h3 className="font-display text-2xl font-bold text-on-surface mb-3">{log.item_id || "Situation"}</h3>
                        <div className="flex items-center gap-2 text-tertiary font-bold">
                          <CheckCircle2 size={18} /> Lesson Completed
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                if (log.sub_category === "pronunciation") {
                  const isMastered = log.status === "mastered";
                  return (
                    <motion.div 
                      key={log._id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * Math.min(i, 10) }}
                      className="bg-surface-container-lowest rounded-[2rem] p-8 lg:p-10 shadow-sm border border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] bg-surface-container-low px-3 py-1 rounded-full outline outline-1 outline-outline-variant/30">
                            {date}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                            <Mic2 size={12} /> Pronunciation
                          </span>
                        </div>
                        <h3 className="font-display text-2xl font-bold text-on-surface mb-3 leading-snug italic">"{log.item_id || "Sentence"}"</h3>
                        <div className="flex items-center gap-4">
                          <div className="text-xl font-bold text-on-surface-variant">
                            Score: <span className={isMastered ? "text-primary" : "text-error"}>{log.score || 0}/100</span>
                          </div>
                          {isMastered && (
                            <div className="flex items-center gap-1 text-tertiary font-bold text-sm">
                              <CheckCircle2 size={16} /> Mastered
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                return null; // Don't fall through to conversation rendering
              }

              const ai = log.ai_result || {};
              const hasError = ai.has_error;
              const hasSuggestions = ai.advanced_suggestions && ai.advanced_suggestions.length > 0;
              
              return (
                <motion.div 
                  key={log._id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * Math.min(i, 10) }}
                  className="bg-surface-container-lowest rounded-[2rem] p-8 lg:p-10 shadow-sm border border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] bg-surface-container-low px-3 py-1 rounded-full outline outline-1 outline-outline-variant/30">
                        {date}
                      </span>
                    </div>
                    <h3 className="font-display text-2xl font-bold text-on-surface mb-3">{log.topic || "General Conversation"}</h3>
                    <p className="text-body-md text-on-surface-variant mb-6 leading-relaxed line-clamp-2 italic">
                      "{ai.original_text || "..."}"
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {hasError ? (
                        <div className="bg-error-container/30 text-error text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-2 border border-error/10">
                          <AlertCircle size={14} /> Needs Correction
                        </div>
                      ) : (
                        <div className="bg-tertiary-container/30 text-tertiary text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-2 border border-tertiary/10">
                          <CheckCircle2 size={14} /> Perfect Grammar
                        </div>
                      )}
                      {hasSuggestions && (
                        <div className="bg-secondary-container/20 text-secondary text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-2 border border-secondary/10">
                          <Lightbulb size={14} /> Vocab Upgrade
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center">
                    <button 
                      onClick={() => { setSelectedSession(log); setShowModal(true); }}
                      className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-sm bg-primary text-on-primary hover:bg-primary-container"
                    >
                      <Play size={18} fill="currentColor" />
                      Review
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Review Modal */}
      <AnimatePresence>
        {showModal && selectedSession && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-surface-container-lowest w-full max-w-2xl rounded-[2rem] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6 border-b border-outline-variant/20 pb-4">
                <div>
                  <h3 className="font-display text-2xl font-bold text-on-surface">{selectedSession.topic || "General"}</h3>
                  <p className="text-sm text-on-surface-variant mt-1">
                    {new Date(selectedSession.created_at).toLocaleString()}
                  </p>
                </div>
                <button onClick={closeModal} className="text-on-surface-variant hover:bg-surface-container p-2 rounded-full transition-colors">
                  <X size={24}/>
                </button>
              </div>
              
              <div className="space-y-6">
                {/* User Input */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-2">You said:</h4>
                  <div className="bg-surface-container-low border border-outline-variant/30 p-4 rounded-2xl text-on-surface font-medium italic">
                    "{selectedSession.ai_result?.original_text}"
                  </div>
                </div>

                {/* Correction */}
                {selectedSession.ai_result?.has_error && (
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-error mb-2 flex items-center gap-2">
                      <AlertCircle size={16} /> Correction
                    </h4>
                    <div className="bg-error-container/10 border border-error/20 p-4 rounded-2xl space-y-3">
                      <p className="text-on-surface font-medium">"{selectedSession.ai_result?.corrected_text}"</p>
                      <p className="text-sm text-on-surface-variant">{selectedSession.ai_result?.error_explanation}</p>
                    </div>
                  </div>
                )}

                {/* AI Response */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                    <CheckCircle2 size={16} /> AI Tutor Response
                  </h4>
                  <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl flex flex-col gap-4">
                    <p className="text-on-surface leading-relaxed font-medium">
                      {selectedSession.ai_result?.ai_response}
                    </p>
                    <button 
                      onClick={() => isPlaying ? stopAudio() : playAudio(selectedSession.ai_result?.ai_response)}
                      className={`self-start flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isPlaying ? 'bg-primary/20 text-primary' : 'bg-primary text-on-primary hover:bg-primary/90'}`}
                    >
                      {isPlaying ? <StopCircle size={16} /> : <Volume2 size={16} />}
                      {isPlaying ? 'Stop' : 'Play AI Voice'}
                    </button>
                  </div>
                </div>
                
                {/* Suggestions */}
                {selectedSession.ai_result?.advanced_suggestions && selectedSession.ai_result.advanced_suggestions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-secondary mb-2 flex items-center gap-2">
                      <Lightbulb size={16} /> Vocabulary Upgrades
                    </h4>
                    <ul className="flex flex-wrap gap-2">
                      {selectedSession.ai_result.advanced_suggestions.map((s: string, i: number) => (
                        <li key={i} className="bg-secondary-container/20 text-secondary border border-secondary/20 px-4 py-2 rounded-xl text-sm font-medium">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
