import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { savedPatentsAPI } from '../utils/api';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import Toast from '../components/Toast';
import { Bookmark, Eye, Trash2 } from 'lucide-react';

export default function SavedPatents() {
  const [savedPatents, setSavedPatents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    async function loadSaved() {
      try {
        const data = await savedPatentsAPI.getAll();
        setSavedPatents(data || []);
      } catch (err) {
        console.error('Failed to load saved patents:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSaved();
  }, []);

  const handleRemove = async (patentId) => {
    if (!window.confirm('Remove this patent from your saved library?')) return;
    try {
      await savedPatentsAPI.remove(patentId);
      setSavedPatents(savedPatents.filter(p => p.id !== patentId));
      setToastMsg('Patent removed from saved list.');
    } catch (err) {
      setToastMsg(`Error: ${err.message}`);
    }
  };

  const columns = [
    {
      header: 'Patent Reference',
      accessor: (row) => (
        <div>
          <span className="font-mono font-bold text-white block">{row.patent_number}</span>
          <span className="text-xs text-[#A3A3A3] truncate max-w-[280px] block" title={row.title}>{row.title}</span>
        </div>
      )
    },
    {
      header: 'Technology Domain',
      accessor: (row) => <span className="text-xs text-[#A3A3A3]">{row.category}</span>
    },
    {
      header: 'Assignee',
      accessor: (row) => <span className="text-xs text-[#A3A3A3]">{row.assignee || '—'}</span>
    },
    {
      header: 'Saved Date',
      accessor: (row) => (
        <span className="text-xs text-[#666666]">
          {row.saved_at ? new Date(row.saved_at).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      header: 'Actions',
      cellClassName: 'text-right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link to={`/patent/${row.patent_number}`}>
            <Button variant="outline" size="sm" icon={Eye}>
              View
            </Button>
          </Link>
          <button
            onClick={() => handleRemove(row.id)}
            className="p-1.5 rounded-lg border border-[#262626] bg-[#0A0A0A] text-[#666666] hover:text-[#EF4444] hover:border-[#EF4444]/30 transition-colors"
            title="Remove Bookmark"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4] max-w-7xl mx-auto w-full">
        <LoadingState type="table" count={4} />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4] overflow-y-auto max-w-7xl mx-auto w-full space-y-8 select-none">
      <Toast message={toastMsg} type="info" onClose={() => setToastMsg('')} />

      {/* Header */}
      <div className="border-b border-[#262626] pb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-white tracking-tight">Saved Patents</h1>
          <p className="text-xs text-[#A3A3A3] mt-1">Bookmarked prior art references and saved analysis reports. ({savedPatents.length} saved)</p>
        </div>
        <Link to="/patent-library">
          <Button variant="secondary" size="md" icon={Bookmark}>
            Browse Library
          </Button>
        </Link>
      </div>

      {savedPatents.length === 0 ? (
        <EmptyState
          title="No saved patents yet"
          description="Bookmark patents from the library or analysis reports to save them here."
          actionLabel="Explore Patent Library"
          onAction={() => window.location.href = '/patent-library'}
          icon={Bookmark}
        />
      ) : (
        <DataTable
          columns={columns}
          data={savedPatents}
          emptyMessage="No saved patents."
        />
      )}
    </div>
  );
}
