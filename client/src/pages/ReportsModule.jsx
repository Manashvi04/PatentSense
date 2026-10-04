import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analysisAPI } from '../utils/api';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Button from '../components/Button';
import SearchBar from '../components/SearchBar';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import { FileText, Download, Share2, Eye, Trash2 } from 'lucide-react';

export default function ReportsModule() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    async function loadReports() {
      try {
        const data = await analysisAPI.getHistory();
        setReports(data || []);
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const handleShare = (id) => {
    navigator.clipboard.writeText(`${window.location.origin}/analysis/${id}`);
    setToastMsg('Report URL copied to clipboard.');
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await analysisAPI.deleteRecord(id);
      setReports(reports.filter(r => r.id !== id));
      setToastMsg('Report deleted.');
    } catch (err) {
      setToastMsg(`Error: ${err.message}`);
    }
  };

  const filteredReports = reports.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.technology_domain && r.technology_domain.toLowerCase().includes(search.toLowerCase()))
  );

  const columns = [
    {
      header: 'Report',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#262626] border border-[#404040] flex items-center justify-center text-white shrink-0">
            <FileText className="w-4 h-4 text-[#A3A3A3]" />
          </div>
          <div>
            <span className="font-semibold text-white block max-w-[240px] truncate" title={row.title}>{row.title}</span>
            <span className="text-[10px] text-[#666666] font-mono">Report ID: PS-{row.id}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Patent / Domain',
      accessor: (row) => <span className="text-xs text-[#A3A3A3]">{row.technology_domain || 'AI Research'}</span>
    },
    {
      header: 'Created',
      accessor: (row) => <span className="text-xs text-[#666666]">{new Date(row.created_at).toLocaleDateString()}</span>
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.status === 'Completed' ? 'completed' : 'processing'}>
          {row.status || 'Completed'}
        </Badge>
      )
    },
    {
      header: 'Action',
      cellClassName: 'text-right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link to={`/analysis/${row.id}`}>
            <Button variant="outline" size="sm" icon={Eye}>
              View
            </Button>
          </Link>
          <Button variant="secondary" size="sm" icon={Download} onClick={() => window.print()}>
            Download
          </Button>
          <button
            onClick={() => handleShare(row.id)}
            className="p-1.5 rounded-lg border border-[#262626] bg-[#0A0A0A] text-[#A3A3A3] hover:text-white hover:border-[#404040]"
            title="Share Link"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => handleDelete(row.id, e)}
            className="p-1.5 rounded-lg border border-[#262626] bg-[#0A0A0A] text-[#666666] hover:text-[#EF4444] hover:border-[#EF4444]/30"
            title="Delete Report"
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
        <LoadingState type="table" count={5} />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4] overflow-y-auto max-w-7xl mx-auto w-full space-y-8 select-none">
      <Toast message={toastMsg} type="info" onClose={() => setToastMsg('')} />

      {/* Header */}
      <div className="border-b border-[#262626] pb-6">
        <h1 className="font-display font-extrabold text-3xl text-white tracking-tight">Generated Reports</h1>
        <p className="text-xs text-[#A3A3A3] mt-1">Export, share, or download generated patent novelty audit reports.</p>
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        onClear={() => setSearch('')}
        placeholder="Filter reports by title or domain..."
      />

      {filteredReports.length === 0 ? (
        <EmptyState
          title={search ? "No reports match your search" : "No reports yet"}
          description={search ? "Try different keywords." : "Submit a patent analysis to generate your first report."}
          actionLabel={search ? "Clear Search" : "+ New Analysis"}
          onAction={search ? () => setSearch('') : () => window.location.href = '/new-analysis'}
          icon={FileText}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredReports}
          emptyMessage="No reports found."
        />
      )}
    </div>
  );
}
