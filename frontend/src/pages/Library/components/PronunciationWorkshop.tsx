import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Loader2, Mic2, Square, RefreshCcw, Volume2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const TARGET_SENTENCES = [
  "The quick brown fox jumps over the lazy dog.",
  "She sells seashells by the seashore.",
  "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
  "I thought a thought, but the thought I thought wasn't the thought I thought I thought."
];

export default function PronunciationWorkshop({ email, onBack }: { email: string, onBack: () => void }) {
  const [sentences, setSentences] = useState(TARGET_SENTENCES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const targetSentence = sentences[currentIndex];
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await evaluateAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError(null);
      setResult(null);
    } catch (err) {
      console.error(err);
      setError("Microphone access denied or error occurred.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const evaluateAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'pronunciation.webm');
      formData.append('target_text', targetSentence);

      const res = await fetch(`${API_URL}/api/library/pronunciation`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        if (data.score > 80) {
          // Save progress as mastered
          await fetch(`${API_URL}/api/progress/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_email: email,
              category: "library",
              sub_category: "pronunciation",
              item_id: targetSentence,
              status: "mastered",
              score: data.score
            })
          });
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextSentence = async () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setResult(null);
      setError(null);
    } else {
      setIsProcessing(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/library/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_email: email, 
            task_type: "pronunciation_sentences", 
            context: "Challenging pronunciation practice sentences" 
          })
        });
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else if (data.sentences && data.sentences.length > 0) {
          setSentences(prev => [...prev, ...data.sentences]);
          setCurrentIndex(currentIndex + 1);
          setResult(null);
        }
      } catch (err: any) {
        setError("Failed to generate new sentences: " + err.message);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const playAudio = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(targetSentence);
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

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold mb-8">
        <ArrowLeft size={20} /> Back to Library
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center shadow-sm">
          <Mic2 size={28} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-on-surface">Pronunciation Workshop</h1>
          <p className="text-on-surface-variant">Read the sentence aloud. AI will evaluate your accent and rhythm.</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 lg:p-12 shadow-sm mb-8 flex flex-col items-center text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">Target Sentence</p>
        <h2 className="text-3xl lg:text-4xl font-display font-medium text-on-surface mb-12 leading-relaxed">
          "{targetSentence}"
        </h2>

        <div className="flex gap-4">
          <button 
            onClick={handleNextSentence}
            disabled={isRecording || isProcessing || isPlaying}
            className="w-14 h-14 rounded-full border border-outline-variant/30 flex justify-center items-center text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            <RefreshCcw size={20} />
          </button>
          
          <button 
            onClick={() => isPlaying ? stopAudio() : playAudio()}
            disabled={isRecording || isProcessing}
            className={`w-14 h-14 rounded-full flex justify-center items-center transition-colors disabled:opacity-50 ${isPlaying ? 'bg-primary/20 text-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}
          >
            <Volume2 size={24} />
          </button>
          
          {isRecording ? (
            <button 
              onClick={stopRecording}
              className="w-14 h-14 rounded-full bg-error text-on-error flex justify-center items-center shadow-lg hover:bg-error/90 animate-pulse"
            >
              <Square size={20} fill="currentColor" />
            </button>
          ) : (
            <button 
              onClick={startRecording}
              disabled={isProcessing}
              className="w-14 h-14 rounded-full bg-primary text-on-primary flex justify-center items-center shadow-lg hover:bg-primary/90 transition-transform hover:scale-105 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <Mic2 size={24} />}
            </button>
          )}
        </div>
        {isRecording && <p className="text-error font-bold mt-4 animate-pulse">Recording...</p>}
        {isProcessing && <p className="text-primary font-bold mt-4">Evaluating your pronunciation...</p>}
      </div>

      {error && (
        <div className="p-4 bg-error-container/20 text-error rounded-xl mb-8 border border-error/20 font-medium">
          {error}
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            <div className={`p-8 rounded-3xl border shadow-sm ${result.score > 80 ? 'bg-tertiary-container/20 border-tertiary/30' : 'bg-surface-container-lowest border-outline-variant/30'}`}>
              <div className="flex items-center gap-6 mb-6">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-display font-bold text-white shadow-lg ${result.score > 80 ? 'bg-tertiary' : result.score > 60 ? 'bg-secondary' : 'bg-error'}`}>
                  {result.score}
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold text-on-surface mb-1">
                    {result.score > 80 ? 'Excellent!' : result.score > 60 ? 'Good Effort!' : 'Keep Practicing'}
                  </h3>
                  <p className="text-on-surface-variant font-medium">
                    {result.score > 80 ? 'You mastered this sentence.' : 'Room for improvement.'}
                  </p>
                </div>
              </div>
              
              <div className="bg-surface-container border border-outline-variant/20 rounded-2xl p-6">
                <h4 className="font-bold text-sm uppercase tracking-widest text-on-surface-variant mb-3">Tutor's Feedback</h4>
                <p className="text-on-surface leading-relaxed text-lg">{result.feedback}</p>
                
                {result.words_to_practice && result.words_to_practice.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-bold text-sm uppercase tracking-widest text-error mb-3">Words to Practice</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.words_to_practice.map((word: string, i: number) => (
                        <span key={i} className="px-4 py-2 bg-error/10 text-error rounded-xl font-bold text-sm border border-error/20">{word}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
