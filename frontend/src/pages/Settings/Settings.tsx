import { User, Languages, Bell, ShieldCheck, ChevronDown, Trash2, X, Phone, MapPin, Camera, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Settings() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    address: user?.address || '',
    phone: user?.phone || '',
    picture: user?.picture || ''
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        address: user.address || '',
        phone: user.phone || '',
        picture: user.picture || ''
      });
    }
  }, [user]);

  // ── Voice & Audio State ──
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>(
    localStorage.getItem('preferredVoice') || ''
  );
  const [tempo, setTempo] = useState<string>(
    localStorage.getItem('speechTempo') || 'Natural'
  );

  // ── Preferences State ──
  const [notifications, setNotifications] = useState({
    reminders: true,
    reflections: true,
    new_content: false
  });
  const [dataSharing, setDataSharing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user?.user_id) {
      fetchPreferences();
    }
  }, [user?.user_id]);

  const fetchPreferences = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/user/preferences/${user?.user_id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data) {
        if (data.notifications) setNotifications(data.notifications);
        if (data.dataSharing !== undefined) setDataSharing(data.dataSharing);
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    }
  };

  const savePreferences = async (updatedNotifications: any, updatedDataSharing: boolean) => {
    if (!user?.user_id) return;
    setIsUpdating(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/user/preferences/${user?.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notifications: updatedNotifications,
          dataSharing: updatedDataSharing
        })
      });
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotificationChange = (key: string) => {
    const updated = { ...notifications, [key]: !(notifications as any)[key] };
    setNotifications(updated);
    savePreferences(updated, dataSharing);
  };

  const handleDataSharingChange = () => {
    const updated = !dataSharing;
    setDataSharing(updated);
    savePreferences(notifications, updated);
  };

  const handleDeleteAccount = async () => {
    if (!user?.user_id) return;
    const confirmed = window.confirm("Are you sure? This will delete all your learning history and cannot be undone.");
    if (!confirmed) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/user/account/${user.user_id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        logout();
        navigate('/login');
      } else {
        alert("Failed to delete account. Please try again.");
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      alert("An error occurred. Please try again.");
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.user_id) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/user/profile/${user.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        updateUser(updatedUser);
        setIsProfileModalOpen(false);
      } else {
        alert("Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm(prev => ({ ...prev, picture: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const enVoices = allVoices.filter(v => v.lang.startsWith('en'));
      setVoices(enVoices);
      
      if (!localStorage.getItem('preferredVoice') && enVoices.length > 0) {
        const defaultVoice = enVoices.find(v => v.name.includes('Google US English') || v.name.includes('Microsoft Aria')) || enVoices[0];
        setSelectedVoice(defaultVoice.name);
        localStorage.setItem('preferredVoice', defaultVoice.name);
      }
    };
    
    loadVoices();
    // Some browsers populate voices asynchronously
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedVoice(val);
    localStorage.setItem('preferredVoice', val);
    
    // Preview the voice
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance("Hi there, I'm ready to chat.");
    const voice = voices.find(v => v.name === val);
    if (voice) u.voice = voice;
    const rateMap: Record<string, number> = { Relaxed: 0.85, Natural: 1.0, Fluent: 1.15 };
    u.rate = rateMap[tempo] || 1.0;
    window.speechSynthesis.speak(u);
  };

  const handleTempoChange = (mode: string) => {
    setTempo(mode);
    localStorage.setItem('speechTempo', mode);
    
    // Preview the tempo
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`This is the ${mode} tempo.`);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) u.voice = voice;
    const rateMap: Record<string, number> = { Relaxed: 0.85, Natural: 1.0, Fluent: 1.15 };
    u.rate = rateMap[mode] || 1.0;
    window.speechSynthesis.speak(u);
  };
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
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-surface-container shadow-inner group flex items-center justify-center bg-surface-container">
                {user?.picture ? (
                  <img 
                    alt="User Avatar" 
                    className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                    src={user.picture} 
                  />
                ) : (
                  <div className="text-3xl font-bold text-primary">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
                  </div>
                )}
                <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="absolute bottom-0 inset-x-0 bg-surface-container-highest/90 backdrop-blur-md text-[10px] font-bold py-2 text-center text-on-surface hover:text-primary transition-colors"
                >
                  EDIT
                </button>
              </div>
              <div>
                <h3 className="font-display text-3xl font-bold text-on-surface">{user?.name || 'Guest User'}</h3>
                <div className="flex flex-col gap-1 mt-1">
                  <p className="text-body-md text-on-surface-variant">{user?.email || 'No email provided'}</p>
                  {user?.phone && <p className="text-xs text-on-surface-variant/80 flex items-center gap-1.5"><Phone size={12}/> {user.phone}</p>}
                  {user?.address && <p className="text-xs text-on-surface-variant/80 flex items-center gap-1.5"><MapPin size={12}/> {user.address}</p>}
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="px-8 py-3 rounded-2xl border border-outline text-on-surface font-bold text-sm hover:bg-surface-container transition-all outline-none"
            >
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
                  <select 
                    value={selectedVoice}
                    onChange={handleVoiceChange}
                    className="w-full appearance-none bg-surface-container-low border border-outline-variant/50 rounded-2xl py-4 pl-6 pr-12 text-on-surface font-bold text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-shadow"
                  >
                    {voices.map(v => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                    {voices.length === 0 && (
                      <option>Loading voices...</option>
                    )}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
                </div>
                <p className="text-xs text-on-surface-variant mt-3 leading-relaxed">Select the voice that feels most encouraging for you. Selecting a voice will play a preview.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">AI Speech Tempo</label>
                <div className="bg-surface-container-low p-1.5 rounded-2xl flex items-center gap-1.5">
                  {['Relaxed', 'Natural', 'Fluent'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleTempoChange(mode)}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                        tempo === mode 
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
                      <input 
                        checked={item.title === 'Gentle Reminders' ? notifications.reminders : item.title === 'Weekly Reflections' ? notifications.reflections : notifications.new_content} 
                        className="sr-only peer" 
                        type="checkbox" 
                        onChange={() => handleNotificationChange(item.title === 'Gentle Reminders' ? 'reminders' : item.title === 'Weekly Reflections' ? 'reflections' : 'new_content')} 
                      />
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
                <input 
                  checked={dataSharing} 
                  className="sr-only peer" 
                  type="checkbox" 
                  onChange={handleDataSharingChange} 
                />
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
              <button 
                onClick={handleDeleteAccount}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-error/30 text-error font-bold text-xs hover:bg-error-container/50 transition-all"
              >
                <Trash2 size={14} />
                Delete Account
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Manage Profile Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-surface-container-lowest w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-display text-2xl font-bold text-on-surface flex items-center gap-3">
                  <User className="text-primary" size={24} /> Edit Profile
                </h3>
                <button 
                  onClick={() => setIsProfileModalOpen(false)}
                  className="text-on-surface-variant hover:bg-surface-container p-2 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="flex flex-col items-center mb-8">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface-container flex items-center justify-center bg-surface-container transition-all group-hover:opacity-80">
                      {profileForm.picture ? (
                        <img src={profileForm.picture} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={32} className="text-on-surface-variant" />
                      )}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={24} className="text-white drop-shadow-md" />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-primary mt-2 uppercase tracking-widest">Change Photo</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Full Name</label>
                    <input 
                      type="text"
                      value={profileForm.name}
                      onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl px-6 py-4 text-on-surface focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                      placeholder="Your name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
                      <input 
                        type="tel"
                        value={profileForm.phone}
                        onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                        className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl pl-14 pr-6 py-4 text-on-surface focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                        placeholder="Your phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
                      <input 
                        type="text"
                        value={profileForm.address}
                        onChange={e => setProfileForm({...profileForm, address: e.target.value})}
                        className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl pl-14 pr-6 py-4 text-on-surface focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                        placeholder="Your address"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl border border-outline text-on-surface font-bold hover:bg-surface-container transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isUpdating}
                    className="flex-[2] py-4 rounded-2xl bg-primary text-on-primary font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                  >
                    {isUpdating ? <Loader2 className="animate-spin" size={20} /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
