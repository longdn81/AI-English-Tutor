import { Coffee, Plane, Briefcase, Users, HeartPulse, Sparkles, ArrowRight, Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const recommendations = [
  {
    id: 'cafe',
    tag: 'Daily Life',
    icon: Coffee,
    color: 'primary',
    bg: 'bg-primary/5',
    title: 'Ordering at a Cafe',
    description: 'Practice ordering coffee, asking about pastries, and handling simple transactions in a bustling environment.',
    large: true
  },
  {
    id: 'airport',
    tag: 'Travel',
    icon: Plane,
    color: 'secondary',
    bg: 'bg-secondary/5',
    title: 'At the Airport',
    description: 'Checking in, finding your gate, and asking for directions.'
  }
];

const categories = [
  {
    title: 'Business',
    icon: Briefcase,
    color: 'text-tertiary',
    bg: 'bg-tertiary-container/10',
    topics: ['Job Interview', 'Project Update', 'Networking Event']
  },
  {
    title: 'Socializing',
    icon: Users,
    color: 'text-primary',
    bg: 'bg-primary-container/10',
    topics: ['Meeting New Friends', 'Dinner Party', 'Discussing Movies']
  },
  {
    title: 'Emergency',
    icon: HeartPulse,
    color: 'text-error',
    bg: 'bg-error-container/20',
    topics: ['At the Pharmacy', 'Seeing a Doctor', 'Lost Items']
  }
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-[1120px] mx-auto px-4 lg:px-16 py-12 flex flex-col gap-12">
      <header className="flex flex-col gap-4">
        <h1 className="font-display text-4xl lg:text-5xl font-bold text-on-surface">What shall we talk about?</h1>
        <p className="text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
          Select a topic to start your conversational practice. Choose from everyday scenarios or specialized vocabulary.
        </p>
      </header>

      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Sparkles className="text-primary fill-primary" size={24} />
          <h2 className="font-display text-2xl font-bold text-on-surface">Recommended for You</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/speak/${item.id}`)}
              className={`${item.large ? 'md:col-span-2' : ''} group relative overflow-hidden rounded-[2rem] bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 text-left flex flex-col min-h-[280px] p-8`}
            >
              <div className={`absolute top-0 right-0 w-64 h-64 ${item.bg} rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-colors duration-500 group-hover:bg-primary/10`} />
              <div className="flex-1 flex flex-col relative">
                <div className="flex justify-between items-start mb-auto">
                  <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container text-sm font-semibold text-on-surface-variant`}>
                    <item.icon size={16} />
                    {item.tag}
                  </span>
                  <ArrowRight size={20} className="text-outline-variant group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <div className="mt-8">
                  <h3 className={`font-display font-bold text-on-surface mb-2 ${item.large ? 'text-3xl' : 'text-2xl'}`}>{item.title}</h3>
                  <p className="text-body-md text-on-surface-variant max-w-md line-clamp-2">{item.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="font-display text-2xl font-bold text-on-surface">Browse Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div key={cat.title} className="bg-surface-container-lowest rounded-[2rem] p-2 border border-outline-variant/20 shadow-sm transition-all hover:shadow-md">
              <div className="p-6 flex items-center gap-4 border-b border-outline-variant/10">
                <div className={`w-12 h-12 rounded-2xl ${cat.bg} ${cat.color} flex items-center justify-center`}>
                  <cat.icon size={24} strokeWidth={2.5} />
                </div>
                <h3 className="font-display text-xl font-bold text-on-surface">{cat.title}</h3>
              </div>
              <div className="p-2 flex flex-col gap-1">
                {cat.topics.map((topic) => (
                  <button 
                    key={topic} 
                    onClick={() => navigate(`/speak/${topic.toLowerCase().replace(' ', '-')}`)}
                    className="w-full text-left px-5 py-4 rounded-2xl hover:bg-surface-container transition-all flex items-center justify-between group"
                  >
                    <span className="text-sm font-medium text-on-surface-variant group-hover:text-on-surface">{topic}</span>
                    <ChevronRight size={16} className="text-transparent group-hover:text-primary transition-colors translate-x-[-4px] group-hover:translate-x-0 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4">
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-[2.5rem] p-8 lg:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
          <div className="relative z-10 flex-1">
            <h3 className="font-display text-2xl font-bold text-on-surface mb-2">Can't find what you need?</h3>
            <p className="text-on-surface-variant">Type a specific scenario, and LingoFlow will generate a custom practice session for you.</p>
          </div>
          <div className="relative z-10 w-full md:w-auto min-w-[320px]">
            <input 
              className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-full pl-8 pr-16 py-4 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" 
              placeholder="e.g. Asking for a raise" 
              type="text"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center hover:bg-primary-container shadow-md transition-all active:scale-95">
              <ArrowRight size={20} className="-rotate-45" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
