import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function TopicPhrases({ email, onBack }: { email: string, onBack: () => void }) {
  const [situation, setSituation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [phrasesData, setPhrasesData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleGenerate = async () => {
    if (!situation.trim()) return;
    setIsLoading(true);
    setError(null);
    setPhrasesData(null);
    setIsCompleted(false);
    
    try {
      const res = await fetch(`${API_URL}/api/library/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_email: email, 
          task_type: "phrases", 
          context: situation 
        })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setPhrasesData(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    setIsLoading(true);
    try {
      await fetch(`${API_URL}/api/progress/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: email,
          category: "library",
          sub_category: "phrases",
          item_id: situation,
          status: "completed"
        })
      });
      setIsCompleted(true);
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold mb-8">
        <ArrowLeft size={20} /> Back to Library
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-tertiary-container/20 text-tertiary flex items-center justify-center shadow-sm">
          <Sparkles size={28} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-on-surface">Topic-based Phrases</h1>
          <p className="text-on-surface-variant">Enter any situation and AI will generate 10 practical phrases for you.</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 shadow-sm mb-8">
        <label className="block text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">Custom Situation</label>
        <div className="flex gap-4">
          <input 
            type="text" 
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder="e.g. Checking in at a hotel, Ordering vegan food..."
            className="flex-1 bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-tertiary transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button 
            onClick={handleGenerate}
            disabled={isLoading || !situation.trim()}
            className="px-8 py-3 bg-tertiary text-on-tertiary font-bold rounded-xl hover:bg-tertiary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && !phrasesData ? <Loader2 className="animate-spin" size={20} /> : 'Generate'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error-container/20 text-error rounded-xl mb-8 border border-error/20 font-medium">
          {error}
        </div>
      )}

      <AnimatePresence>
        {phrasesData && phrasesData.phrases && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            {phrasesData.phrases.map((phrase: any, i: number) => (
              <div key={i} className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm flex flex-col gap-2">
                <p className="text-xl font-bold text-on-surface">{phrase.english}</p>
                <p className="text-lg text-tertiary font-medium">{phrase.vietnamese}</p>
                <div className="mt-2 text-sm text-on-surface-variant bg-tertiary/10 p-3 rounded-lg border border-tertiary/20">
                  <span className="font-bold text-tertiary uppercase text-xs mr-2 tracking-widest">Note</span>
                  {phrase.nuance}
                </div>
              </div>
            ))}

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleMarkCompleted}
                disabled={isCompleted || isLoading}
                className="px-8 py-4 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isCompleted ? <><CheckCircle2 size={24} /> Completed!</> : 'Mark as Completed & Return'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
