import React, { useEffect, useState } from 'react';
import AreaChart from '../components/AreaChart';
import Card from '../components/Card';
import ScoreCard from '../components/ScoreCard';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Toast from '../components/Toast';
import { ShieldCheck, Users, Activity, FileText, CheckCircle, AlertOctagon, CornerDownRight, MessageSquare } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    try {
      const token = localStorage.getItem('token');
      const [statsRes, usersRes, logsRes, feedbackRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/logs', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/feedback', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
        setUsers(await usersRes.json());
        setLogs(await logsRes.json());
        setFeedback(await feedbackRes.json());
      }
    } catch (err) {
      console.error("Admin fetch notice:", err);
    } finally {
      setLoading(false);
    }
  }

  const sampleUsers = users.length > 0 ? users : [
    { id: 1, full_name: "Dr. Eleanor Vance", email: "evance@lawfirm.com", role: "admin", created_at: "2026-01-10" },
    { id: 2, full_name: "Marcus Thorne", email: "mthorne@techcorp.com", role: "user", created_at: "2026-02-14" },
    { id: 3, full_name: "Sarah Lin", email: "slin@bioresearch.org", role: "user", created_at: "2026-03-01" }
  ];

  const sampleLogs = logs.length > 0 ? logs : [
    { timestamp: new Date().toISOString(), level: "INFO", message: "System scan pipeline vector embedding generation complete." },
    { timestamp: new Date().toISOString(), level: "INFO", message: "User session authenticated: evance@lawfirm.com" }
  ];

  const handleRoleToggle = (userId, currentRole) => {
    const targetRole = currentRole === 'admin' ? 'user' : 'admin';
    setUsers(sampleUsers.map(u => u.id === userId ? { ...u, role: targetRole } : u));
    setToastMsg(`User role updated to ${targetRole}.`);
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
        <Button variant="outline" size="sm" onClick={() => handleRoleToggle(row.id, row.role)}>
          Toggle Role
        </Button>
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
        <ScoreCard title="TOTAL ACTIVE USERS" value={stats?.totalUsers || "142"} icon={Users} />
        <ScoreCard title="TOTAL SCANS RUN" value={stats?.totalSearches || "1,248"} icon={Activity} />
        <ScoreCard title="AVG NOVELTY RATING" value={`${stats?.avgNovelty || 82}%`} icon={CheckCircle} />
        <ScoreCard title="REFERENCE PATENTS" value="10,000+" icon={FileText} />
      </div>

      {/* Grid of Users & Logs */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-display font-bold text-xl text-white">Registered User Directory</h3>
          <DataTable columns={userColumns} data={sampleUsers} />
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-display font-bold text-base text-white border-b border-[#262626] pb-3">Access Logs</h3>
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {sampleLogs.map((log, i) => (
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
        </div>
      </div>

    </div>
  );
}
