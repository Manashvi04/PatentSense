import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import ScoreCard from '../components/ScoreCard';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Toast from '../components/Toast';
import { ShieldCheck, Users, Activity, FileText, CheckCircle, Trash2, MessageSquare } from 'lucide-react';
import { adminAPI } from '../utils/api';

export default function AdminDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyUserId, setBusyUserId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    setError('');
    try {
      const [statsData, usersData, logsData, feedbackData] = await Promise.all([
        adminAPI.getStats(), adminAPI.getUsers(), adminAPI.getLogs(), adminAPI.getFeedback(),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setLogs(logsData);
      setFeedback(feedbackData);
    } catch (err) {
      setError(err.message || 'Could not load administrator data.');
    } finally {
      setLoading(false);
    }
  }

  const handleRoleToggle = async (userId, currentRole) => {
    const targetRole = currentRole === 'admin' ? 'user' : 'admin';
    setBusyUserId(userId);
    try {
      await adminAPI.updateRole(userId, targetRole);
      setUsers((items) => items.map((item) => item.id === userId ? { ...item, role: targetRole } : item));
      setToastMsg(`User role updated to ${targetRole}.`);
    } catch (err) {
      setToastMsg(err.message || 'Could not update this user role.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDeleteUser = async (row) => {
    if (!window.confirm(`Delete ${row.email} and their saved patents and reports? This cannot be undone.`)) return;
    setBusyUserId(row.id);
    try {
      await adminAPI.deleteUser(row.id);
      setUsers((items) => items.filter((item) => item.id !== row.id));
      setToastMsg('User and associated data deleted.');
    } catch (err) {
      setToastMsg(err.message || 'Could not delete this user.');
    } finally {
      setBusyUserId(null);
    }
  };

  const userColumns = [
    {
      header: 'Name',
      accessor: (row) => <span className="font-semibold text-white">{row.full_name}</span>
    },
    {
      header: 'Email',
      accessor: (row) => <span className="text-xs font-mono text-[#A3A3A3]">{row.email}</span>
    },
    {
      header: 'Role',
      accessor: (row) => (
        <Badge variant={row.role === 'admin' ? 'white' : 'neutral'}>
          {row.role}
        </Badge>
      )
    },
    {
      header: 'Registration',
      accessor: (row) => <span className="text-xs text-[#666666]">{new Date(row.created_at).toLocaleDateString()}</span>
    },
    {
      header: 'Action',
      cellClassName: 'text-right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={row.id === user?.id || busyUserId === row.id} onClick={() => handleRoleToggle(row.id, row.role)}>{row.role === 'admin' ? 'Make User' : 'Make Admin'}</Button>
          <Button variant="danger" size="sm" disabled={row.id === user?.id || busyUserId === row.id} icon={Trash2} onClick={() => handleDeleteUser(row)}>Delete</Button>
        </div>
      )
    }
  ];

  return (
    <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4] overflow-y-auto max-w-7xl mx-auto w-full space-y-8 select-none">
      <Toast message={toastMsg} type="info" onClose={() => setToastMsg('')} />

      {/* Title */}
      <div className="border-b border-[#262626] pb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-black">
          <ShieldCheck className="w-6 h-6 stroke-black text-black" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-3xl text-white tracking-tight">System Administration</h1>
          <p className="text-xs text-[#A3A3A3] mt-1">Audit active accounts, review vector similarity queries, and inspect server logs.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ScoreCard title="TOTAL ACTIVE USERS" value={stats?.totalUsers ?? 0} icon={Users} />
        <ScoreCard title="TOTAL SCANS RUN" value={stats?.totalSearches ?? 0} icon={Activity} />
        <ScoreCard title="AVG NOVELTY RATING" value={`${stats?.avgNovelty ?? 0}%`} icon={CheckCircle} />
        <ScoreCard title="REFERENCE PATENTS" value={stats?.referencePatents ?? 0} icon={FileText} />
      </div>

      {/* Grid of Users & Logs */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-display font-bold text-xl text-white">Registered User Directory</h3>
          {error ? <div role="alert" className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-sm text-[#FCA5A5]">{error}<button className="ml-3 underline" onClick={loadAdminData}>Retry</button></div> : loading ? <p className="text-sm text-[#A3A3A3]">Loading administrator data…</p> : <DataTable columns={userColumns} data={users} emptyMessage="No registered users." />}
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-display font-bold text-base text-white border-b border-[#262626] pb-3">Access Logs</h3>
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {logs.map((log, i) => (
                <div className="space-y-1 text-xs" key={i}>
                  <div className="flex justify-between items-center text-[10px] font-bold text-[#A3A3A3]">
                    <span>[{log.level}]</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[11px] text-[#A3A3A3] font-mono leading-normal pl-2 border-l border-[#404040]">
                    {log.message}
                  </p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6 space-y-4">
            <h3 className="font-display font-bold text-base text-white border-b border-[#262626] pb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4" />User Feedback</h3>
            {feedback.length ? <div className="space-y-3 max-h-[220px] overflow-y-auto">{feedback.map((item) => <p key={item.id} className="text-xs text-[#A3A3A3] border-l border-[#404040] pl-3">{item.message}<span className="block mt-1 text-[10px] text-[#666]">{new Date(item.created_at).toLocaleString()}</span></p>)}</div> : <p className="text-xs text-[#666]">No feedback submitted.</p>}
          </Card>
        </div>
      </div>

    </div>
  );
}
