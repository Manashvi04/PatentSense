import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../components/DataTable';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import LoadingState from '../components/LoadingState';
import { savedPatentsAPI } from '../utils/api';
import { Bookmark, Eye, Trash2 } from 'lucide-react';

export default function SavedPatents() {
  const [savedPatents, setSavedPatents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const loadSaved = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSavedPatents(await savedPatentsAPI.getAll());
    } catch (err) {
      setError(err.message || 'Could not load saved patents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSaved(); }, [loadSaved]);

  const handleRemove = async (patentId) => {
    setBusyId(patentId);
    try {
      await savedPatentsAPI.delete(patentId);
      setSavedPatents((items) => items.filter((patent) => patent.id !== patentId));
      setToastMsg('Patent removed from saved list.');
    } catch (err) {
      setToastMsg(err.message || 'Could not remove saved patent.');
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    {
      header: 'Patent Reference',
      accessor: (row) => <div><span className="font-mono font-bold text-white block">{row.patent_number}</span><span className="text-xs text-[#A3A3A3] truncate max-w-[280px] block" title={row.title}>{row.title}</span></div>,
    },
    { header: 'Technology Domain', accessor: (row) => <span className="text-xs text-[#A3A3A3]">{row.category || 'Uncategorized'}</span> },
    { header: 'Saved Date', accessor: (row) => <span className="text-xs text-[#666666]">{row.saved_at ? new Date(`${row.saved_at.replace(' ', 'T')}Z`).toLocaleDateString() : '—'}</span> },
    {
      header: 'Actions', cellClassName: 'text-right',
      accessor: (row) => <div className="flex items-center justify-end gap-2"><Link to={`/patent/${row.patent_number}`}><Button variant="outline" size="sm" icon={Eye}>View</Button></Link><button disabled={busyId === row.id} onClick={() => handleRemove(row.id)} className="p-1.5 rounded-lg border border-[#262626] bg-[#0A0A0A] text-[#666666] hover:text-[#EF4444] hover:border-[#EF4444]/30 disabled:opacity-50" title="Remove Bookmark" aria-label={`Remove ${row.patent_number} from saved patents`}><Trash2 className="w-3.5 h-3.5" /></button></div>,
    },
  ];

  return (
    <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4] overflow-y-auto max-w-7xl mx-auto w-full space-y-8 select-none">
      <Toast message={toastMsg} type="info" onClose={() => setToastMsg('')} />
      <div className="border-b border-[#262626] pb-6"><h1 className="font-display font-extrabold text-3xl text-white tracking-tight">Saved Patents</h1><p className="text-xs text-[#A3A3A3] mt-1">Your bookmarked prior art references.</p></div>
      {loading ? <LoadingState type="table" count={5} /> : error ? <div role="alert" className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-sm text-[#FCA5A5]">{error}<button className="ml-3 underline" onClick={loadSaved}>Retry</button></div> : savedPatents.length === 0 ? <EmptyState title="No saved patents yet" description="Bookmark patents from the library or analysis results to save them here." actionLabel="Explore Patent Library" onAction={() => { window.location.href = '/patent-library'; }} icon={Bookmark} /> : <DataTable columns={columns} data={savedPatents} emptyMessage="No saved patents." />}
    </div>
  );
}
