import React, { useState } from 'react';
import { User, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function SignUp() {
  const { login, registerWithEmail } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (name.trim().length < 2) throw new Error('Please enter your full name.');
      await registerWithEmail(name.trim(), email, password);
      navigate('/speak');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setIsLoading(true);
    setError(null);
    try {
      await login(credentialResponse.credential);
      navigate('/speak');
    } catch (err: any) {
      setError(err.message || 'Google Sign-Up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background antialiased overflow-hidden relative">
       {/* Ambient background elements */}
       <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-secondary/5 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <main className="w-full max-w-[480px] bg-surface-container-lowest rounded-3xl p-8 md:p-10 shadow-xl border border-outline-variant/30 relative z-10 flex flex-col items-center">
        <header className="text-center w-full mb-8 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center mb-4 text-on-primary-container">
            <Activity size={28} strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-4xl text-primary font-bold tracking-tight mb-2">LingoFlow</h1>
          <p className="text-on-surface-variant">Begin your language journey.</p>
        </header>

        {error && (
          <div className="w-full mb-5 p-3 bg-error-container/20 border border-error/20 rounded-xl text-error text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form className="w-full flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface pl-1" htmlFor="fullName">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant" size={20} />
              <input 
                className="w-full bg-surface-container border border-outline-variant rounded-xl pl-12 pr-4 py-3 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" 
                id="fullName" 
                placeholder="Enter your full name" 
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface pl-1" htmlFor="email">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant" size={20} />
              <input 
                className="w-full bg-surface-container border border-outline-variant rounded-xl pl-12 pr-4 py-3 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" 
                id="email" 
                placeholder="you@example.com" 
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface pl-1" htmlFor="password">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant" size={20} />
              <input 
                className="w-full bg-surface-container border border-outline-variant rounded-xl pl-12 pr-12 py-3 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" 
                id="password" 
                placeholder="Create a strong password (min 6 chars)" 
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface transition-colors"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            disabled={isLoading}
            className="w-full bg-primary text-on-primary font-semibold rounded-xl py-4 mt-2 hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="w-full flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-outline-variant/40" />
          <span className="text-xs font-medium text-on-surface-variant">OR</span>
          <div className="flex-1 h-px bg-outline-variant/40" />
        </div>

        {/* Google Sign-Up */}
        <div className="flex justify-center w-full">
          {isLoading ? (
            <div className="flex items-center gap-2 text-on-surface-variant py-2">
              <Loader2 className="animate-spin" size={18} />
              <span className="text-sm font-medium">Connecting...</span>
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Sign-Up failed. Please try again.')}
              useOneTap
              shape="circle"
              size="large"
              text="signup_with"
              theme="outline"
            />
          )}
        </div>

        <footer className="mt-8 text-center w-full">
          <p className="text-sm text-on-surface-variant">
            Already have an account? 
            <Link to="/login" className="ml-1 text-primary font-semibold hover:underline underline-offset-4">Log in</Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
