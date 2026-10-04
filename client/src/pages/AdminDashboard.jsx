import React, { useEffect, useState } from 'react';
import AreaChart from '../components/AreaChart';
import Card from '../components/Card';
import ScoreCard from '../components/ScoreCard';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Toast from '../components/Toast';
import LoadingState from '../components/LoadingState';
import { adminAPI } from '../utils/api';
import { ShieldCheck, Users, Activity, FileText, CheckCircle, AlertOctagon, Trash2 } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    setLoading(true);
    try {
      const [statsData, usersData, logsData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getLogs()
      ]);
      setStats(statsData);
      setUsers(usersData || []);
      setLogs(logsData || []);
    } catch (err) {
      console.error('Admin fetch error:', err);
      setToastMsg(`Error loading admin data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const handleRoleToggle = async (userId, currentRole) => {
    const targetRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await adminAPI.updateUserRole(userId, targetRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: targetRole } : u));
      setToastMsg(`User role updated to ${targetRole}.`);
    } catch (err) {
      setToastMsg(`Error: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Delete user ${email}? This will also delete all their analyses.`)) return;
    try {
      await adminAPI.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      setToastMsg('User deleted successfully.');
    } catch (err) {
      setToastMsg(`Error: ${err.message}`);
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
      header: 'Actions',
      cellClassName: 'text-right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => handleRoleToggle(row.id, row.role)}>
            Toggle Role
          </Button>
          <button
            onClick={() => handleDeleteUser(row.id, row.email)}
            className="p-1.5 rounded-lg border border-[#262626] bg-[#0A0A0A] text-[#666666] hover:text-[#EF4444] hover:border-[#EF4444]/30 transition-colors"
            title="Delete User"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4] max-w-7xl mx-auto w-full space-y-8">
        <LoadingState type="cards" count={4} />
        <LoadingState type="table" count={5} />
      </div>
    );
  }

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

      {/* Metrics Row — all real data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ScoreCard title="TOTAL ACTIVE USERS" value={stats?.totalUsers ?? 0} icon={Users} />
        <ScoreCard title="TOTAL SCANS RUN" value={stats?.totalSearches ?? 0} icon={Activity} />
        <ScoreCard title="AVG NOVELTY RATING" value={`${stats?.avgNovelty ?? 0}%`} icon={CheckCircle} />
        <ScoreCard title="REGISTERED USERS" value={users.length} icon={FileText} />
      </div>

      {/* Search Activity Chart */}
      {stats?.searchTrends && stats.searchTrends.length > 0 && (
        <div className="p-6 rounded-2xl border border-[#262626] bg-[#1A1A1A] space-y-4">
          <div>
            <h3 className="font-display font-bold text-base text-white">Search Activity (Last 7 Days)</h3>
            <p className="text-xs text-[#A3A3A3] mt-0.5">Daily patent analysis scans across all users.</p>
          </div>
          <AreaChart data={stats.searchTrends.map(d => ({ label: d.date, value: d.count }))} height={140} />
        </div>
      )}

      {/* Grid of Users & Logs */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-xl text-white">Registered User Directory</h3>
            <span className="text-xs text-[#A3A3A3]">{users.length} total user{users.length !== 1 ? 's' : ''}</span>
          </div>
          <DataTable columns={userColumns} data={users} emptyMessage="No users registered yet." />
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-display font-bold text-base text-white border-b border-[#262626] pb-3">
              Activity Logs
              <span className="ml-2 text-[10px] text-[#555555] font-mono font-normal">LIVE</span>
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <p className="text-xs text-[#555555]">No activity logged yet.</p>
              ) : logs.map((log, i) => (
                <div className="space-y-1 text-xs" key={i}>
                  <div className="flex justify-between items-center text-[10px] font-bold text-[#A3A3A3]">
                    <span className={
                      log.level === 'ERROR' ? 'text-[#EF4444]' :
                      log.level === 'WARNING' ? 'text-[#F59E0B]' : 'text-[#A3A3A3]'
                    }>[{log.level}]</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[11px] text-[#A3A3A3] font-mono leading-normal pl-2 border-l border-[#404040]">
                    {log.message}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={loadAdminData}
              className="text-xs text-[#666666] hover:text-white transition-colors underline"
            >
              Refresh logs
            </button>
          </Card>
        </div>
      </div>

    </div>
  );
}
