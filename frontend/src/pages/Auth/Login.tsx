import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Activity, Loader2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login, loginWithEmail } = useAuth();
  const navigate = useNavigate();

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
      await loginWithEmail(email, password);
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
      setError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background p-4">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-secondary/5 blur-[100px]" />
      </div>

      <main className="w-full max-w-md relative z-10">
        <div className="bg-surface-container-lowest rounded-3xl p-8 sm:p-10 border border-outline-variant/20 shadow-xl shadow-primary/5">

          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center mb-4 text-on-primary-container">
              <Activity size={28} strokeWidth={2.5} />
            </div>
            <h1 className="font-display text-3xl font-bold text-primary text-center tracking-tight">LingoFlow</h1>
            <p className="text-on-surface-variant text-sm text-center mt-1">Your AI-powered English tutor</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 bg-error-container/20 border border-error/20 rounded-xl text-error text-sm font-medium text-center">
              {error}
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-on-surface pl-1" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant" size={18} />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-surface-container border border-outline-variant rounded-xl pl-11 pr-4 py-3 text-on-surface placeholder:text-outline text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between pl-1 pr-1">
                <label className="text-sm font-medium text-on-surface" htmlFor="password">Password</label>
                <Link to="/forgot-password" size="sm" className="text-xs text-primary font-semibold hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant" size={18} />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={6}
                  required
                  className="w-full bg-surface-container border border-outline-variant rounded-xl pl-11 pr-12 py-3 text-on-surface placeholder:text-outline text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
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
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-on-primary rounded-xl py-3.5 font-bold tracking-wide hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-60 mt-1"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px bg-outline-variant/40" />
            <span className="text-xs font-medium text-on-surface-variant">OR</span>
            <div className="flex-1 h-px bg-outline-variant/40" />
          </div>

          {/* Google Sign-In */}
          <div className="flex justify-center">
            {isLoading ? (
              <div className="flex items-center gap-2 text-on-surface-variant py-2">
                <Loader2 className="animate-spin" size={18} />
                <span className="text-sm font-medium">Connecting...</span>
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Sign-In failed. Please try again.')}
                useOneTap
                shape="circle"
                size="large"
                text="signin_with"
                theme="outline"
              />
            )}
          </div>

          <footer className="mt-8 text-center w-full">
            <p className="text-sm text-on-surface-variant">
              Don't have an account? 
              <Link to="/signup" className="ml-1 text-primary font-semibold hover:underline underline-offset-4">Create account</Link>
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
