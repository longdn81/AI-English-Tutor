import React from 'react';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function SignUp() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/speak');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface antialiased overflow-hidden relative">
       {/* Ambient background elements */}
       <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-secondary/5 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <main className="w-full max-w-[480px] bg-surface-container-lowest rounded-3xl p-8 md:p-10 shadow-xl border border-outline-variant/30 relative z-10 flex flex-col items-center">
        <header className="text-center w-full mb-10">
          <h1 className="font-display text-4xl text-primary font-bold tracking-tight mb-2">LingoFlow</h1>
          <p className="text-on-surface-variant">Begin your language journey.</p>
        </header>

        <form className="w-full flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface pl-1" htmlFor="fullName">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant" size={20} />
              <input 
                className="w-full bg-surface border border-outline-variant rounded-xl pl-12 pr-4 py-3 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" 
                id="fullName" 
                placeholder="Enter your full name" 
                type="text"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface pl-1" htmlFor="email">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant" size={20} />
              <input 
                className="w-full bg-surface border border-outline-variant rounded-xl pl-12 pr-4 py-3 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" 
                id="email" 
                placeholder="you@example.com" 
                type="email"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface pl-1" htmlFor="password">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant" size={20} />
              <input 
                className="w-full bg-surface border border-outline-variant rounded-xl pl-12 pr-4 py-3 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" 
                id="password" 
                placeholder="Create a strong password" 
                type="password"
                required
              />
            </div>
          </div>

          <button className="w-full bg-primary text-on-primary font-semibold rounded-full py-4 mt-4 hover:bg-primary-container shadow-lg shadow-primary/20 transition-all duration-200 flex items-center justify-center gap-2 group">
            <span>Sign Up</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

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
