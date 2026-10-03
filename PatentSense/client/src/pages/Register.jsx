import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import Input from '../components/Input';
import Button from '../components/Button';
import Toast from '../components/Toast';
import { Sparkles, Mail, Lock, User, Building, Check, ArrowRight } from 'lucide-react';

export default function Register({ setUser }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('Patent Attorney');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [terms, setTerms] = useState(false);
  
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Calculate password strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score: 25, label: 'Weak', color: 'bg-[#EF4444]' };
    if (score === 3) return { score: 50, label: 'Fair', color: 'bg-[#F59E0B]' };
    if (score === 4) return { score: 75, label: 'Good', color: 'bg-white' };
    return { score: 100, label: 'Strong', color: 'bg-[#10B981]' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!terms) {
      setError('You must accept the Terms & Conditions to register.');
      return;
    }

    setLoading(true);

    try {
      const data = await authAPI.register(email, password, fullName);
      setUser(data.user);
      setToastMsg('Account created successfully!');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6 text-[#D4D4D4] select-none">
      <Toast message={toastMsg} type="success" onClose={() => setToastMsg('')} />

      <div className="w-full max-w-[480px] p-8 rounded-2xl border border-[#262626] bg-[#0A0A0A] space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-black">
              <Sparkles className="w-4 h-4 fill-black text-black" />
            </div>
            <span className="font-display font-extrabold text-xl text-white tracking-tight">PATENTSENSE</span>
          </div>
          <h2 className="text-xl font-bold text-white">Create Enterprise Account</h2>
          <p className="text-xs text-[#A3A3A3]">Register to evaluate novelty profiles & prior art disclosures.</p>
        </div>

        {error && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] px-4 py-3 rounded-xl text-xs font-semibold leading-relaxed text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="Dr. Eleanor Vance"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            icon={User}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="evance@lawfirm.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Organization"
              type="text"
              placeholder="Vance IP Law"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              icon={Building}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">
                Professional Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-[#262626] bg-[#0A0A0A] text-white text-xs outline-none focus:border-white"
              >
                <option value="Patent Attorney">Patent Attorney</option>
                <option value="Patent Researcher">Patent Researcher</option>
                <option value="R&D Manager">R&D Manager</option>
                <option value="Tech Startup Founder">Tech Startup Founder</option>
                <option value="Academic Researcher">Academic Researcher</option>
              </select>
            </div>
          </div>

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Lock}
            required
          />

          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-[#A3A3A3]">Strength Requirements (8+ chars, Uppercase, Number, Special):</span>
                <span className="text-white uppercase">{strength.label}</span>
              </div>
              <div className="h-1.5 bg-[#262626] rounded-full overflow-hidden">
                <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: `${strength.score}%` }} />
              </div>
            </div>
          )}

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={Lock}
            required
          />

          {/* Terms checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#A3A3A3] leading-normal">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="w-4 h-4 rounded bg-[#0A0A0A] border-[#404040] accent-white cursor-pointer mt-0.5"
              />
              <span>
                I agree to the <a href="#terms" className="text-white underline">Terms & Conditions</a> and acknowledge the privacy policy for patent disclosures.
              </span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full mt-4"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="text-center text-xs text-[#A3A3A3] pt-2">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-white hover:underline">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
