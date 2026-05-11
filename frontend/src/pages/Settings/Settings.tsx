import { User, Languages, Bell, ShieldCheck, ChevronDown, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Settings() {
  return (
    <div className="w-full max-w-[1120px] mx-auto px-4 lg:px-16 py-12 flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-4xl lg:text-5xl font-bold text-on-surface">Preferences</h1>
        <p className="text-body-lg text-on-surface-variant leading-relaxed">
          Manage your mindful learning environment.
        </p>
      </header>

      <div className="space-y-8 pb-12">
        {/* Account Profile Section */}
        <section className="bg-surface-container-lowest rounded-[2.5rem] border border-outline-variant/30 p-8 lg:p-12 shadow-sm">
          <h2 className="font-display text-2xl font-bold text-on-surface mb-8 flex items-center gap-3">
            <User className="text-primary" size={24} /> 
            Account Profile
          </h2>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex items-center gap-8">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-surface-container shadow-inner group">
                <img 
                  alt="User Avatar" 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&h=256&auto=format&fit=crop" 
                />
                <button className="absolute bottom-0 inset-x-0 bg-surface-container-highest/90 backdrop-blur-md text-[10px] font-bold py-2 text-center text-on-surface hover:text-primary transition-colors">EDIT</button>
              </div>
              <div>
                <h3 className="font-display text-3xl font-bold text-on-surface">Alex Mercer</h3>
                <p className="text-body-md text-on-surface-variant mt-1">alex.mercer@mindfulfluent.com</p>
              </div>
            </div>
            <button className="px-8 py-3 rounded-2xl border border-outline text-on-surface font-bold text-sm hover:bg-surface-container transition-all outline-none">
              Manage Account
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Voice & Audio Settings */}
          <section className="bg-surface-container-lowest rounded-[2.5rem] border border-outline-variant/30 p-8 shadow-sm flex flex-col h-full">
            <h2 className="font-display text-xl font-bold text-on-surface mb-8 flex items-center gap-3">
              <Languages className="text-secondary" size={20} /> 
              Voice & Audio
            </h2>
            <div className="space-y-8 flex-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">AI Conversation Partner</label>
                <div className="relative">
                  <select className="w-full appearance-none bg-surface-container-low border border-outline-variant/50 rounded-2xl py-4 pl-6 pr-12 text-on-surface font-bold text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-shadow">
                    <option>Emilia (Calm, British English)</option>
                    <option>Mateo (Warm, Spanish)</option>
                    <option>Yuki (Clear, Japanese)</option>
                    <option>Liam (Energetic, American English)</option>
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
                </div>
                <p className="text-xs text-on-surface-variant mt-3 leading-relaxed">Select the voice that feels most encouraging for you.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">AI Speech Tempo</label>
                <div className="bg-surface-container-low p-1.5 rounded-2xl flex items-center gap-1.5">
                  {['Relaxed', 'Natural', 'Fluent'].map((mode) => (
                    <button
                      key={mode}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                        mode === 'Natural' 
                          ? 'bg-surface-container-lowest shadow-sm text-primary' 
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Notifications Settings */}
          <section className="bg-surface-container-lowest rounded-[2.5rem] border border-outline-variant/30 p-8 shadow-sm flex flex-col h-full">
            <h2 className="font-display text-xl font-bold text-on-surface mb-8 flex items-center gap-3">
              <Bell className="text-tertiary" size={20} /> 
              Notifications
            </h2>
            <div className="space-y-6 flex-1">
              {[
                { title: 'Gentle Reminders', desc: 'Daily prompts to practice speaking.' },
                { title: 'Weekly Reflections', desc: 'Summary of your conversational progress.' },
                { title: 'New Content', desc: 'When new scenarios are added.', off: true }
              ].map((item, i) => (
                <div key={item.title} className="group">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">{item.title}</h4>
                      <p className="text-xs text-on-surface-variant mt-1">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input checked={!item.off} className="sr-only peer" type="checkbox" onChange={() => {}} />
                      <div className="w-12 h-7 bg-surface-container-high rounded-full peer peer-checked:bg-primary transition-all after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-[19px] after:w-[19px] after:transition-all peer-checked:after:translate-x-full shadow-inner" />
                    </label>
                  </div>
                  {i < 2 && <div className="h-px bg-outline-variant/10 mt-4" />}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Privacy Section */}
        <section className="bg-surface-container-lowest rounded-[2.5rem] border border-outline-variant/30 p-8 lg:p-12 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-outline-variant/5 rounded-full blur-3xl" />
          <h2 className="font-display text-2xl font-bold text-on-surface mb-8 flex items-center gap-3">
            <ShieldCheck className="text-outline" size={24} /> 
            Privacy & Data
          </h2>
          
          <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-xl">
                <h4 className="text-sm font-bold text-on-surface">Data Sharing for Model Improvement</h4>
                <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                  Allow anonymous snippets of your conversations to be used to improve our speech recognition models. This helps make the app more accurate for everyone.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input className="sr-only peer" type="checkbox" onChange={() => {}} />
                <div className="w-12 h-7 bg-surface-container-high rounded-full peer peer-checked:bg-primary transition-all after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-[19px] after:w-[19px] after:transition-all peer-checked:after:translate-x-full shadow-inner" />
              </label>
            </div>
            
            <div className="h-px bg-outline-variant/10" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-xl">
                <h4 className="text-sm font-bold text-error">Delete Account</h4>
                <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                  Permanently remove your account, voice history, and learning progress. This action cannot be undone.
                </p>
              </div>
              <button className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-error/30 text-error font-bold text-xs hover:bg-error-container/50 transition-all">
                <Trash2 size={14} />
                Delete Account
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
