import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '../utils/api';
import Input from '../components/Input';
import Button from '../components/Button';
import { ArrowLeft, CheckCircle2, LockKeyhole, Sparkles } from 'lucide-react';

export default function ResetPassword({ setUser }) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!token) return setError('The password reset token is missing. Request a new reset link.');
    if (password.length < 8) return setError('Use at least 8 characters for your password.');
    if (password !== confirmation) return setError('The passwords do not match.');
    setLoading(true);
    try {
      await authAPI.confirmPasswordReset(token, password);
      authAPI.logout();
      setUser?.(null);
      setComplete(true);
    } catch (err) {
      setError(err.message || 'This reset link could not be used.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6 text-[#D4D4D4]">
      <div className="w-full max-w-[420px] p-8 rounded-2xl border border-[#262626] bg-[#0A0A0A] space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 mb-1"><div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center"><Sparkles className="w-4 h-4" /></div><span className="font-display font-extrabold text-xl text-white tracking-tight">PATENTSENSE</span></div>
          <h1 className="text-xl font-bold text-white">Choose a New Password</h1>
          <p className="text-xs text-[#A3A3A3]">Reset links expire after 30 minutes and can only be used once.</p>
        </div>
        {complete ? <div className="space-y-5 text-center"><CheckCircle2 className="w-10 h-10 text-[#10B981] mx-auto" /><p className="text-sm text-white">Your password has been changed.</p><Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-white hover:underline"><ArrowLeft className="w-3.5 h-3.5" />Back to Login</Link></div> : <form onSubmit={submit} className="space-y-5">
          {error && <p role="alert" className="text-xs text-[#FCA5A5]">{error}</p>}
          <Input label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} icon={LockKeyhole} autoComplete="new-password" required />
          <Input label="Confirm New Password" type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} icon={LockKeyhole} autoComplete="new-password" required />
          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">Reset Password</Button>
          <div className="text-center"><Link to="/forgot-password" className="text-xs font-semibold text-[#A3A3A3] hover:text-white">Request another reset link</Link></div>
        </form>}
      </div>
    </div>
  );
}
