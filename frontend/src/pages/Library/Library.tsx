import { BookOpen, Layers, MessagesSquare, Mic2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const categories = [
  {
    id: 'grammar',
    icon: BookOpen,
    bgIcon: 'bg-primary-container/20 text-primary',
    title: 'Grammar Guides',
    desc: 'Deep dives into sentence structure and rules, presented simply. No jargon, just clear explanations and contextual examples.',
    tags: ['12 Lessons', 'Intermediate'],
    large: true
  },
  {
    id: 'vocab',
    icon: Layers,
    bgIcon: 'bg-secondary-container/20 text-secondary',
    title: 'Vocabulary Sets',
    desc: 'Thematic word lists focusing on high-frequency, practical usage for everyday conversations.',
    progress: 45
  },
  {
    id: 'phrases',
    icon: MessagesSquare,
    bgIcon: 'bg-tertiary-container/20 text-tertiary',
    title: 'Topic-based Phrases',
    desc: 'Ready-to-use sentences for specific situations like traveling, ordering food, or business meetings.',
    tags: ['8 Topics'],
  },
  {
    id: 'pronunciation',
    icon: Mic2,
    bgIcon: 'bg-surface-container-high text-on-surface',
    title: 'Pronunciation Workshop',
    desc: 'Audio-focused exercises to refine your accent and rhythm. Listen, repeat, and get subtle feedback on tricky sounds.',
    large: true,
    action: 'Start Workshop'
  }
];

export default function Library() {
  return (
    <div className="w-full max-w-[1120px] mx-auto px-4 lg:px-16 py-12 flex flex-col gap-12">
      <header className="flex flex-col gap-4">
        <h1 className="font-display text-4xl lg:text-5xl font-bold text-on-surface">Library</h1>
        <p className="text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
          Explore curated learning materials designed for mindful fluency. Take your time, practice at your own pace.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-surface-container-lowest rounded-[2rem] p-8 lg:p-10 border border-outline-variant/30 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-between group relative overflow-hidden ${cat.large ? 'md:col-span-2' : ''}`}
          >
            {cat.large && (
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700" />
            )}
            
            <div className="relative z-10">
              <div className={`w-14 h-14 rounded-2xl ${cat.bgIcon} flex items-center justify-center mb-8 shadow-sm transition-transform group-hover:scale-110`}>
                <cat.icon size={28} />
              </div>
              <h2 className="font-display text-2xl font-bold text-on-surface mb-3">{cat.title}</h2>
              <p className="text-body-md text-on-surface-variant max-w-md leading-relaxed">{cat.desc}</p>
            </div>

            <div className="mt-10 relative z-10">
              {cat.tags && (
                <div className="flex gap-2.5">
                  {cat.tags.map(tag => (
                    <span key={tag} className="px-4 py-1.5 bg-surface-container-low text-on-surface-variant rounded-full text-xs font-bold uppercase tracking-wider outline outline-1 outline-outline-variant/20">{tag}</span>
                  ))}
                </div>
              )}
              
              {cat.progress !== undefined && (
                <div>
                  <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden mb-3">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.progress}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="bg-secondary h-full rounded-full" 
                    />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">{cat.progress}% Mastered</p>
                </div>
              )}

              {cat.action && (
                <button className="inline-flex items-center gap-2.5 px-8 py-3 bg-surface-container text-on-surface font-bold text-sm rounded-2xl hover:bg-surface-container-high transition-all outline outline-1 outline-outline-variant/30">
                  {cat.action}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
