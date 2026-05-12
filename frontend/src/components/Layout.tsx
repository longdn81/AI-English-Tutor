import { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Mic, History, Library as LibraryIcon, Settings as SettingsIcon, LogOut, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

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
  const navigate = useNavigate();
  const { user, isLoading, logout } = useAuth();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  // Show spinner while restoring session from localStorage
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  // Redirect to login if not authenticated (and not already on auth page)
  if (!user && !isAuthPage) {
    return <Navigate to="/login" replace />;
  }

  if (isAuthPage) return <>{children}</>;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

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

        {/* User profile area */}
        <div className="mt-auto px-2">
          <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-surface-container transition-colors">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-on-surface truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="text-on-surface-variant hover:text-error transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-error/10"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top App Bar */}
      <header className="lg:hidden fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 py-4 bg-surface/80 backdrop-blur-md border-b border-outline-variant/10 shadow-sm">
        <h1 className="font-display text-xl font-bold text-primary">LingoFlow</h1>
        {user?.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/20"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {initials}
          </div>
        )}
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
