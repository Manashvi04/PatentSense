import React, { useEffect, useState } from 'react';
import { authAPI } from '../utils/api';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import { User, Lock, Settings as SettingsIcon, ShieldAlert, LogOut, Check, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings({ user, setUser }) {
  const navigate = useNavigate();
  
  // Profile Section
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [role, setRole] = useState(user?.profession || 'Patent Researcher');
  
  // Security Section
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [twoFactor, setTwoFactor] = useState(false);
  
  // Preferences Section
  const [emailNotifications, setEmailNotifications] = useState(user?.preferences?.notifications ?? true);
  const [defaultDomain, setDefaultDomain] = useState(user?.preferences?.defaultDomain || 'Artificial Intelligence');

  // Modal / Toast
  const [toastMsg, setToastMsg] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  useEffect(() => {
    setFullName(user?.fullName || '');
    setEmail(user?.email || '');
    setOrganization(user?.organization || '');
    setRole(user?.profession || 'Patent Researcher');
    setEmailNotifications(user?.preferences?.notifications ?? true);
    setDefaultDomain(user?.preferences?.defaultDomain || 'Artificial Intelligence');
    setTwoFactor(user?.preferences?.twoFactor || false);
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const response = await authAPI.updateProfile({ fullName, email, organization, profession: role });
      const updatedUser = response.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setToastMsg("Profile details updated successfully.");
    } catch (err) {
      console.error(err);
      setToastMsg(err.message || 'Could not save profile changes.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setToastMsg("Password changed successfully.");
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setToastMsg(err.message || 'Could not change password.');
    }
  };

  const handlePreferencesSave = async (e) => {
    e.preventDefault();
    setPreferencesLoading(true);
    try {
      const response = await authAPI.updatePreferences({
        notifications: emailNotifications,
        defaultDomain,
        twoFactor,
      });
      const updatedUser = { ...user, preferences: { ...user?.preferences, ...response.preferences } };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setToastMsg('Preferences saved.');
    } catch (err) {
      setToastMsg(err.message || 'Could not save preferences.');
    } finally {
      setPreferencesLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    authAPI.logout();
    setUser(null);
    setIsDeleteModalOpen(false);
    navigate('/login');
  };

  return (
    <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4] overflow-y-auto max-w-5xl mx-auto w-full space-y-8 select-none">
      <Toast message={toastMsg} type="info" onClose={() => setToastMsg('')} />

      {/* Header */}
      <div className="border-b border-[#262626] pb-6">
        <h1 className="font-display font-extrabold text-3xl text-white tracking-tight">Account Settings</h1>
        <p className="text-xs text-[#A3A3A3] mt-1">Manage profile credentials, security protocols, notifications, and preferences.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        
        {/* Left Column (2 Cols): Profile & Security */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Section 1: Profile */}
          <Card className="p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
              <User className="w-5 h-5 text-white" />
              <h3 className="font-display font-bold text-base text-white">Profile Information</h3>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Organization"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">
                    Professional Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#262626] bg-[#0A0A0A] text-white text-xs outline-none focus:border-white"
                  >
                    <option value="Patent Attorney">Patent Attorney</option>
                    <option value="Patent Researcher">Patent Researcher</option>
                    <option value="R&D Manager">R&D Manager</option>
                    <option value="Tech Startup Founder">Tech Startup Founder</option>
                  </select>
                </div>
              </div>

              <Button type="submit" variant="primary" size="md" loading={profileLoading} icon={Check}>
                Save Profile Changes
              </Button>
            </form>
          </Card>

          {/* Section 2: Security */}
          <Card className="p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
              <Lock className="w-5 h-5 text-white" />
              <h3 className="font-display font-bold text-base text-white">Security</h3>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Current Password"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="secondary" size="md">
                  Update Password
                </Button>
              </div>
            </form>

            <div className="pt-4 border-t border-[#262626] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Two-Factor Authentication (2FA)</h4>
                  <p className="text-[11px] text-[#A3A3A3]">Add an extra layer of security for patent disclosures.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={twoFactor}
                    onChange={(e) => { setTwoFactor(e.target.checked); setToastMsg(e.target.checked ? "2FA Enabled" : "2FA Disabled"); }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#262626] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                </label>
              </div>
            </div>
          </Card>

        </div>

        {/* Right Column (1 Col): Preferences & Account */}
        <div className="space-y-8">
          
          {/* Section 3: Preferences */}
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
              <SettingsIcon className="w-4 h-4 text-white" />
              <h3 className="font-display font-bold text-sm text-white">Preferences</h3>
            </div>

            <form onSubmit={handlePreferencesSave} className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#A3A3A3]">Email Analysis Alerts</span>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#0A0A0A] border-[#404040] accent-white cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#A3A3A3] uppercase block">
                  Default Domain
                </label>
                <select
                  value={defaultDomain}
                  onChange={(e) => setDefaultDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#262626] bg-[#0A0A0A] text-white text-xs outline-none focus:border-white"
                >
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Biotechnology & Healthcare">Biotechnology & Healthcare</option>
                  <option value="Green Energy & CleanTech">Green Energy & CleanTech</option>
                </select>
              </div>
              <Button type="submit" variant="primary" size="sm" loading={preferencesLoading}>Save Preferences</Button>
            </form>
          </Card>

          {/* Section 4: Account Actions */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
              <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
              <h3 className="font-display font-bold text-sm text-[#EF4444]">Account Management</h3>
            </div>

            <div className="space-y-3 pt-1">
              <Button variant="outline" size="sm" icon={LogOut} onClick={handleLogout} className="w-full justify-start">
                Log Out of Account
              </Button>

              <Button
                variant="danger"
                size="sm"
                icon={AlertTriangle}
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-full justify-start"
              >
                Delete Account
              </Button>
            </div>
          </Card>

        </div>

      </div>

      {/* Delete Account Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Account Confirmation"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#A3A3A3]">
            Are you sure you want to permanently delete your PatentSense account? All stored patent novelty reports, vector analysis logs, and saved disclosures will be permanently erased.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#262626]">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteAccount}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
