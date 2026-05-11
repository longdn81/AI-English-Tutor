import React from 'react';
import { Mail, Lock, ArrowRight, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/speak');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Ambient background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-secondary/5 blur-[100px]" />
      </div>

      <main className="w-full max-w-md px-4 relative z-10">
        <div className="bg-surface-container-lowest rounded-3xl p-8 sm:p-10 border border-outline-variant/20 shadow-xl shadow-primary/5">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mb-6 text-on-primary">
              <Activity size={32} strokeWidth={2.5} />
            </div>
            <h1 className="font-display text-3xl font-bold text-primary text-center mb-2 tracking-tight">
              LingoFlow
            </h1>
            <p className="text-on-surface-variant text-center">
              Welcome back to your mindful journey.
            </p>
          </div>

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-on-surface pl-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant" size={20} />
                <input
                  className="w-full bg-surface-bright border border-outline-variant rounded-xl pl-12 pr-4 py-3 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  id="email"
                  placeholder="you@example.com"
                  type="email"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center pl-1">
                <label className="text-sm font-medium text-on-surface" htmlFor="password">
                  Password
                </label>
                <button type="button" className="text-xs font-semibold text-primary hover:text-primary-container transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant" size={20} />
                <input
                  className="w-full bg-surface-bright border border-outline-variant rounded-xl pl-12 pr-4 py-3 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  required
                />
              </div>
            </div>

            <button
              className="w-full bg-primary text-on-primary rounded-full py-4 mt-2 font-semibold tracking-wide hover:bg-primary-container shadow-lg shadow-primary/20 transition-all duration-200 flex items-center justify-center gap-2 group"
              type="submit"
            >
              <span>Login</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-on-surface-variant">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-primary hover:underline underline-offset-4">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
