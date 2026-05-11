import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Mic, History, Library as LibraryIcon, Settings as SettingsIcon, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: Mic, label: 'Speak', path: '/speak' },
  { icon: History, label: 'History', path: '/history' },
  { icon: LibraryIcon, label: 'Library', path: '/library' },
  { icon: SettingsIcon, label: 'Settings', path: '/settings' },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col border-r border-outline-variant/30 h-screen py-8 px-4 bg-surface-container-low w-64 fixed left-0 top-0">
        <div className="mb-12 px-4">
          <h1 className="font-display text-2xl font-bold text-primary">LingoFlow</h1>
          <p className="text-sm text-on-surface-variant mt-1">Your Language Journey</p>
        </div>
        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            AL
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">Alex Learner</p>
            <p className="text-xs text-on-surface-variant">Spanish - B1</p>
          </div>
        </div>
      </aside>

      {/* Mobile Top App Bar */}
      <header className="lg:hidden fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 py-4 bg-surface/80 backdrop-blur-md border-b border-outline-variant/10 shadow-sm">
        <h1 className="font-display text-xl font-bold text-primary">LingoFlow</h1>
        <button className="text-primary hover:bg-surface-container p-2 rounded-full transition-colors">
          <User size={24} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-20 lg:pt-0 min-h-screen overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center bg-surface/90 backdrop-blur-lg px-4 pb-safe py-3 border-t border-outline-variant/10 rounded-t-xl shadow-lg">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center px-4 py-1 transition-all duration-200 rounded-xl ${
                isActive
                  ? 'bg-primary-container/20 text-primary scale-110'
                  : 'text-on-surface-variant'
              }`
            }
          >
            <item.icon size={20} />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
