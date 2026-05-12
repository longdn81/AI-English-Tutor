import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Loader2, Play, Volume2, StopCircle, Sparkles, RefreshCcw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const HARDCODED_WORDS = ["Diligent", "Procrastinate", "Overwhelmed", "Milestone", "Resilient"];

export default function VocabularySets({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const userEmail = user?.email || '';
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingWords, setIsRefreshingWords] = useState(false);
  const [currentWords, setCurrentWords] = useState(HARDCODED_WORDS);
  const [storyData, setStoryData] = useState<{ story_en: string, translation_vn: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setStoryData(null);
    try {
      const res = await fetch(`${API_URL}/api/library/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_email: userEmail, 
          task_type: "vocab_story", 
          context: currentWords.join(", ") 
        })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setStoryData(data);
        fetch(`${API_URL}/api/library/update-progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_email: userEmail, 
            category: "library", 
            sub_category: "vocabulary", 
            item_id: currentWords.slice(0, 3).join(", ") + "...", 
            status: "completed" 
          })
        }).catch(err => console.error("Failed to update progress:", err));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshWords = async () => {
    setIsRefreshingWords(true);
    setError(null);
    setStoryData(null);
    try {
      const res = await fetch(`${API_URL}/api/library/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_email: userEmail, 
          task_type: "vocab_words", 
          context: "random intermediate to advanced vocabulary" 
        })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.words && data.words.length > 0) {
        setCurrentWords(data.words);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRefreshingWords(false);
    }
  };

  const playAudio = (text: string) => {
    // Strip markdown bold asterisks for TTS
    const cleanText = text.replace(/\*\*/g, '');
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
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

  const formatStoryText = (text: string) => {
    // Basic markdown to bold converter
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-secondary">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold mb-8">
        <ArrowLeft size={20} /> Back to Library
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-secondary-container/20 text-secondary flex items-center justify-center shadow-sm">
          <Sparkles size={28} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-on-surface">Vocabulary Sets</h1>
          <p className="text-on-surface-variant">Learn new words through engaging AI-generated stories.</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 shadow-sm mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-on-surface">Today's Words:</h3>
          <button 
            onClick={handleRefreshWords}
            disabled={isRefreshingWords || isLoading}
            className="flex items-center gap-2 text-sm font-bold text-secondary hover:text-secondary/80 transition-colors disabled:opacity-50"
          >
            <RefreshCcw size={16} className={isRefreshingWords ? "animate-spin" : ""} />
            Change Words
          </button>
        </div>
        <div className="flex flex-wrap gap-3 mb-8">
          {currentWords.map(word => (
            <span key={word} className="px-4 py-2 bg-secondary-container/20 text-secondary rounded-xl font-bold text-sm border border-secondary/20">
              {word}
            </span>
          ))}
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full flex justify-center items-center gap-2 py-4 bg-secondary text-on-secondary font-bold rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
          {isLoading ? 'Generating Story...' : 'Generate AI Story'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-error-container/20 text-error rounded-xl mb-8 border border-error/20 font-medium">
          {error}
        </div>
      )}

      <AnimatePresence>
        {storyData && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
          >
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-display text-2xl font-bold text-on-surface">English Story</h3>
                <button 
                  onClick={() => isPlaying ? stopAudio() : playAudio(storyData.story_en)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isPlaying ? 'bg-secondary/20 text-secondary' : 'bg-secondary text-on-secondary hover:bg-secondary/90'}`}
                >
                  {isPlaying ? <StopCircle size={16} /> : <Volume2 size={16} />}
                  {isPlaying ? 'Stop' : 'Listen'}
                </button>
              </div>
              <p className="text-on-surface text-lg leading-relaxed font-medium">
                {formatStoryText(storyData.story_en)}
              </p>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-tertiary"></div>
              <h3 className="font-display text-xl font-bold text-on-surface mb-4">Vietnamese Translation</h3>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                {storyData.translation_vn}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
