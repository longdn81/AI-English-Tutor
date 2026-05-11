/// <reference types="vite/client" />
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle, XCircle, ChevronRight, Award, ArrowLeft, BookOpen } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function GrammarQuizBoard({ topic, email, onBack }: { topic: string, email: string, onBack: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [quizData, setQuizData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [topic]);

  const fetchQuiz = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/library/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: email, task_type: "grammar_quiz", context: topic })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setQuizData(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isFinished && quizData) {
      fetch(`${API_URL}/api/library/save-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: email,
          topic: topic,
          score: score,
          total_questions: quizData.questions.length
        })
      }).catch(err => console.error("Failed to save score:", err));
    }
  }, [isFinished, quizData, email, topic, score]);

  const handleAnswer = (option: string) => {
    if (selectedAnswer) return; // Prevent double click
    setSelectedAnswer(option);
    if (option === quizData.questions[currentIndex].correct_answer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < quizData.questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
    } else {
      setIsFinished(true);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-6">
        <Loader2 size={48} className="text-primary animate-spin" />
        <p className="text-xl font-display font-bold text-on-surface">Generating Quiz on {topic}...</p>
        <p className="text-on-surface-variant">AI is crafting personalized questions just for you.</p>
      </div>
    );
  }

  if (error || !quizData || !quizData.questions) {
    return (
      <div className="w-full max-w-[800px] mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-error mb-4">Oops! Failed to load quiz.</h2>
        <p className="text-on-surface-variant mb-8">{error || "Unknown error."}</p>
        <button onClick={onBack} className="px-6 py-3 bg-surface-container rounded-xl font-bold">Go Back</button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="w-full max-w-[600px] mx-auto px-4 py-16 text-center">
        <Award size={80} className="text-tertiary mx-auto mb-6" />
        <h2 className="text-4xl font-display font-bold text-on-surface mb-4">Quiz Completed!</h2>
        <p className="text-xl text-on-surface-variant mb-12">You scored <span className="font-bold text-primary">{score}</span> out of {quizData.questions.length}.</p>
        <button onClick={onBack} className="px-8 py-4 bg-primary text-on-primary rounded-xl font-bold text-lg hover:bg-primary/90 shadow-lg shadow-primary/20">Back to Library</button>
      </div>
    );
  }

  const q = quizData.questions[currentIndex];

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold">
          <ArrowLeft size={20} /> Exit Quiz
        </button>
        <div className="font-bold text-sm tracking-widest text-on-surface-variant uppercase">
          Question {currentIndex + 1} / {quizData.questions.length}
        </div>
      </div>

      {currentIndex === 0 && quizData.theory_summary && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/5 border border-primary/20 rounded-3xl p-6 lg:p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-4 text-primary">
            <BookOpen size={24} />
            <h3 className="font-display text-xl font-bold">Mini Lesson</h3>
          </div>
          <p className="text-on-surface leading-relaxed mb-6 font-medium">
            {quizData.theory_summary}
          </p>
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4">
            <p className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-2">Example</p>
            <p className="text-on-surface italic text-lg">"{quizData.example_sentence}"</p>
          </div>
        </motion.div>
      )}

      <motion.div 
        key={currentIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/30"
      >
        <h2 className="text-2xl lg:text-3xl font-medium text-on-surface mb-8 leading-relaxed">
          {q.question}
        </h2>

        <div className="flex flex-col gap-3 mb-8">
          {q.options.map((opt: string, i: number) => {
            const isSelected = selectedAnswer === opt;
            const isCorrect = opt === q.correct_answer;
            let btnClass = "bg-surface-container hover:bg-surface-container-high border-outline-variant/20 text-on-surface";
            
            if (selectedAnswer) {
              if (isCorrect) btnClass = "bg-tertiary/10 border-tertiary text-tertiary";
              else if (isSelected) btnClass = "bg-error/10 border-error text-error";
              else btnClass = "bg-surface-container opacity-50 border-transparent text-on-surface-variant";
            }

            return (
              <button 
                key={i}
                disabled={!!selectedAnswer}
                onClick={() => handleAnswer(opt)}
                className={`w-full flex items-center justify-between text-left p-5 rounded-2xl border-2 font-medium transition-all ${btnClass}`}
              >
                <span className="text-lg">{opt}</span>
                {selectedAnswer && isCorrect && <CheckCircle size={24} className="text-tertiary" />}
                {selectedAnswer && isSelected && !isCorrect && <XCircle size={24} className="text-error" />}
              </button>
            )
          })}
        </div>

        <AnimatePresence>
          {selectedAnswer && (
            <motion.div 
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              className="border-t border-outline-variant/20 pt-6 overflow-hidden"
            >
              <h4 className="font-bold uppercase tracking-widest text-primary text-xs mb-3">Tutor's Explanation</h4>
              <p className="text-on-surface-variant leading-relaxed mb-6">{q.explanation_vn}</p>
              
              <button 
                onClick={handleNext}
                className="w-full flex justify-center items-center gap-2 py-4 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-colors"
              >
                {currentIndex < quizData.questions.length - 1 ? 'Next Question' : 'View Results'} <ChevronRight size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
