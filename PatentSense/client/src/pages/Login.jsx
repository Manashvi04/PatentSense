import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import Input from '../components/Input';
import Button from '../components/Button';
import Toast from '../components/Toast';
import { Sparkles, Mail, Lock, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';

export default function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic Validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const data = await authAPI.login(email, password);
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      }
      setUser(data.user);
      setToastMsg('Login successful. Redirecting...');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex text-[#D4D4D4] select-none">
      <Toast message={toastMsg} type="success" onClose={() => setToastMsg('')} />

      {/* Desktop Left Branding Panel (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0A0A0A] border-r border-[#262626] p-16 flex-col justify-between relative overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
        <div className="absolute w-96 h-96 bg-white/5 rounded-full filter blur-3xl -top-20 -left-20 pointer-events-none" />

        {/* Top Header Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-black">
            <Sparkles className="w-6 h-6 fill-black text-black" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xl text-white tracking-tight">PATENTSENSE</h1>
            <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-widest">AI-Powered Patent Intelligence</p>
          </div>
        </div>

        {/* Center Hero Copy */}
        <div className="space-y-6 max-w-lg relative z-10 my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#404040] bg-[#1A1A1A] text-xs font-semibold text-white">
            <Cpu className="w-3.5 h-3.5" /> Enterprise Legal-Tech SaaS
          </div>

          <h2 className="font-display text-4xl font-extrabold text-white leading-tight tracking-tight">
            Discover novelty.<br />
            Compare prior art.<br />
            Make smarter patent decisions.
          </h2>

          <p className="text-sm text-[#A3A3A3] leading-relaxed">
            PatentSense processes technical disclosures through advanced sentence transformer embeddings to deliver instant, high-precision novelty scores and prior art mapping.
          </p>

          <div className="pt-4 grid grid-cols-2 gap-4 border-t border-[#262626]">
            <div>
              <span className="font-display font-extrabold text-2xl text-white block">384-D</span>
              <span className="text-xs text-[#A3A3A3]">Vector Embeddings</span>
            </div>
            <div>
              <span className="font-display font-extrabold text-2xl text-white block">99.4%</span>
              <span className="text-xs text-[#A3A3A3]">Prior Art Coverage</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center gap-2 text-xs text-[#666666] relative z-10">
          <ShieldCheck className="w-4 h-4 text-white" />
          <span>Encrypted Legal Workspace &bull; ISO 27001 Certified</span>
        </div>
      </div>

      {/* Right Login Form (Full width on Mobile) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-[#000000]">
        <div className="w-full max-w-[420px] space-y-8">
          
          {/* Mobile Only Brand Header */}
          <div className="lg:hidden text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white text-black mx-auto mb-2">
              <Sparkles className="w-6 h-6 fill-black text-black" />
            </div>
            <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">PATENTSENSE</h1>
            <p className="text-xs text-[#A3A3A3]">AI-Powered Patent Intelligence</p>
          </div>

          {/* Form Header */}
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold text-white">Sign In to Your Account</h2>
            <p className="text-xs text-[#A3A3A3]">Enter your credentials to access your patent intelligence workspace.</p>
          </div>

          {/* Validation error message */}
          {error && (
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] px-4 py-3 rounded-xl text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="attorney@lawfirm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              required
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-[#A3A3A3] hover:text-white">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#0A0A0A] border-[#404040] accent-white cursor-pointer"
                />
                <span>Remember me</span>
              </label>

              <Link to="/forgot-password" className="font-semibold text-white hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Footer Link */}
          <div className="text-center text-xs text-[#A3A3A3]">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-white hover:underline inline-flex items-center gap-1 ml-1">
              Create Account <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
