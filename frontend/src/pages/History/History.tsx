import { Clock, SpellCheck, TrendingUp, Play, AlertCircle, Lightbulb, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

const stats = [
  { icon: Clock, color: 'text-primary', label: 'Minutes Practiced', value: '420', sub: 'this week' },
  { icon: SpellCheck, color: 'text-secondary', label: 'Errors Corrected', value: '34', sub: 'improvements' },
];

const logs = [
  {
    date: 'Oct 24, 2023',
    duration: '15 mins',
    title: 'Ordering at a Restaurant',
    desc: 'Practiced polite requests and asking about menu ingredients.',
    badges: [
      { icon: AlertCircle, color: 'bg-error-container/30 text-error', label: 'Verb tense (Past)' },
      { icon: Lightbulb, color: 'bg-secondary-container/20 text-secondary', label: "Vocabulary: 'Appetizer'" },
    ],
    primary: true
  },
  {
    date: 'Oct 22, 2023',
    duration: '20 mins',
    title: 'Discussing Weekend Plans',
    desc: 'Casual conversation about hobbies and future events.',
    badges: [
      { icon: AlertCircle, color: 'bg-error-container/30 text-error', label: 'Prepositions of time' },
    ],
    primary: false
  },
  {
    date: 'Oct 19, 2023',
    duration: '10 mins',
    title: 'Job Interview Practice',
    desc: 'Answering common behavioral questions professionally.',
    badges: [
      { icon: CheckCircle2, color: 'bg-tertiary-container/30 text-tertiary', label: 'Great pronunciation' },
    ],
    primary: false
  },
];

export default function HistoryPage() {
  return (
    <div className="w-full max-w-[1120px] mx-auto px-4 lg:px-16 py-12 flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-4xl lg:text-5xl font-bold text-on-surface">My Journey</h1>
        <p className="text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
          Track your progress and review past conversations.
        </p>
      </header>

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
            <span className="text-xs font-bold uppercase tracking-widest">Fluency Score</span>
          </div>
          <div className="mt-auto h-20 flex items-end justify-between gap-1.5 px-1">
            {[0.3, 0.5, 0.7, 0.9, 1].map((h, i) => (
              <div 
                key={i} 
                className="w-full bg-primary/20 rounded-t-lg transition-all hover:bg-primary/40" 
                style={{ height: `${h * 100}%`, opacity: 0.2 + (i * 0.2) }} 
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Conversation Logs */}
      <section className="flex flex-col gap-6">
        <h2 className="font-display text-2xl font-bold text-on-surface">Recent Conversations</h2>
        <div className="flex flex-col gap-4">
          {logs.map((log, i) => (
            <motion.div 
              key={log.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className="bg-surface-container-lowest rounded-[2rem] p-8 lg:p-10 shadow-sm border border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] bg-surface-container-low px-3 py-1 rounded-full outline outline-1 outline-outline-variant/30">
                    {log.date} • {log.duration}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-bold text-on-surface mb-3">{log.title}</h3>
                <p className="text-body-md text-on-surface-variant mb-6 leading-relaxed">{log.desc}</p>
                <div className="flex flex-wrap gap-2.5">
                  {log.badges.map((badge, j) => (
                    <div key={j} className={`${badge.color} text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-2 border border-black/5`}>
                      <badge.icon size={14} />
                      {badge.label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center">
                <button className={`w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-sm ${log.primary ? 'bg-primary text-on-primary hover:bg-primary-container' : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'}`}>
                  <Play size={18} fill="currentColor" />
                  Review
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
