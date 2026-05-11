import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-react';

const topics = [
  "Subject-Verb Agreement",
  "Verb Tenses (Present, Past, Future)",
  "Prepositions of Time and Place",
  "Articles (a, an, the)",
  "Conditionals (If clauses)",
  "Relative Clauses",
  "Passive Voice",
  "Modal Verbs",
  "Gerunds and Infinitives",
  "Comparatives and Superlatives",
  "Conjunctions and Connectors",
  "Adjectives vs. Adverbs"
];

export default function GrammarTopicList({ onBack, onSelectTopic }: { onBack: () => void, onSelectTopic: (topic: string) => void }) {
  return (
    <div className="w-full max-w-[800px] mx-auto px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold mb-8">
        <ArrowLeft size={20} /> Back to Library
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center shadow-sm">
          <BookOpen size={28} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-on-surface">Grammar Guides</h1>
          <p className="text-on-surface-variant">Select a topic to generate a personalized practice quiz.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topics.map((topic, i) => (
          <motion.button
            key={topic}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelectTopic(topic)}
            className="flex items-center justify-between bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/40 transition-all text-left group"
          >
            <span className="font-bold text-lg text-on-surface group-hover:text-primary transition-colors">{topic}</span>
            <CheckCircle2 className="text-outline-variant/30 group-hover:text-primary transition-colors" size={24} />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
