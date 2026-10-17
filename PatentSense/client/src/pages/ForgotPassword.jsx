import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { authAPI } from '../utils/api';
import { Sparkles, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [developmentResetUrl, setDevelopmentResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.requestPasswordReset(email);
      setDevelopmentResetUrl(response.developmentResetUrl || '');
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not request a password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6 text-[#D4D4D4] select-none">
      <div className="w-full max-w-[420px] p-8 rounded-2xl border border-[#262626] bg-[#0A0A0A] space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-black">
              <Sparkles className="w-4 h-4 fill-black text-black" />
            </div>
            <span className="font-display font-extrabold text-xl text-white tracking-tight">PATENTSENSE</span>
          </div>
          <h2 className="text-xl font-bold text-white">Reset Password</h2>
          <p className="text-xs text-[#A3A3A3]">Recover your patent intelligence workspace credentials</p>
        </div>

        {sent ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-white">Password Reset Requested</h3>
              <p className="text-xs text-[#A3A3A3] leading-relaxed">
                If an account exists for <strong className="text-white">{email}</strong>, reset instructions will be sent to its address.
              </p>
            </div>
            {developmentResetUrl && <a className="inline-block text-xs font-bold text-white underline" href={developmentResetUrl}>Open development reset link</a>}
            <Link to="/login" className="inline-flex items-center justify-center gap-2 text-xs font-bold text-white hover:underline pt-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <p role="alert" className="text-xs text-[#FCA5A5]">{error}</p>}
            <Input
              label="Email Address"
              type="email"
              placeholder="attorney@lawfirm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              {loading ? 'Transmitting...' : 'Send Recovery Verification'}
            </Button>

            <div className="text-center pt-2">
              <Link to="/login" className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#A3A3A3] hover:text-white">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
