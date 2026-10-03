import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analysisAPI } from '../utils/api';
import SearchBar from '../components/SearchBar';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Button from '../components/Button';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import { Plus, ExternalLink, Download, Trash2, Heart } from 'lucide-react';

export default function MyAnalyses() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    async function fetchAnalyses() {
      try {
        const data = await analysisAPI.getHistory();
        setReports(data || []);
      } catch (err) {
        console.error("Fetch history error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalyses();
  }, []);

  const getNoveltyVariant = (score) => {
    if (score >= 75) return 'highNovelty';
    if (score >= 45) return 'mediumNovelty';
    return 'lowNovelty';
  };

  const filteredReports = reports.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.technology_domain && item.technology_domain.toLowerCase().includes(search.toLowerCase()));

    const statusStr = (item.status || 'Completed').toLowerCase();
    let matchesStatus = true;
    if (filterStatus === 'Completed') matchesStatus = statusStr === 'completed';
    else if (filterStatus === 'Processing') matchesStatus = statusStr === 'processing';
    else if (filterStatus === 'Failed') matchesStatus = statusStr === 'failed';

    return matchesSearch && matchesStatus;
  });

  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === 'noveltyHigh') return b.novelty_score - a.novelty_score;
    if (sortBy === 'similarityHigh') return b.similarity_percentage - a.similarity_percentage;
    return 0;
  });

  const handleDelete = (id, e) => {
    e.preventDefault();
    if (window.confirm("Are you sure you want to delete this patent analysis log?")) {
      setReports(reports.filter(r => r.id !== id));
      setToastMsg("Analysis record deleted.");
    }
  };

  const columns = [
    {
      header: 'Patent Title / ID',
      accessor: (row) => (
        <div>
          <span className="font-semibold text-white block max-w-[280px] truncate" title={row.title}>{row.title}</span>
          <span className="text-[10px] text-[#666666] font-mono">ID: PS-{row.id}</span>
        </div>
      )
    },
    {
      header: 'Technology Domain',
      accessor: (row) => <span className="text-xs text-[#A3A3A3] font-medium">{row.technology_domain || 'AI Research'}</span>
    },
    {
      header: 'Novelty Score',
      accessor: (row) => <Badge variant={getNoveltyVariant(row.novelty_score)}>{row.novelty_score}%</Badge>
    },
    {
      header: 'Similarity',
      accessor: (row) => <span className="text-xs font-bold text-white">{row.similarity_percentage}%</span>
    },
    {
      header: 'Status',
      accessor: (row) => {
        const st = (row.status || 'Completed').toLowerCase();
        return (
          <Badge variant={st === 'completed' ? 'completed' : st === 'processing' ? 'processing' : 'failed'}>
            {row.status || 'Completed'}
          </Badge>
        );
      }
    },
    {
      header: 'Date',
      accessor: (row) => (
        <span className="text-xs text-[#666666]">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      header: 'Actions',
      cellClassName: 'text-right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link to={`/analysis/${row.id}`}>
            <Button variant="outline" size="sm" icon={ExternalLink}>
              View
            </Button>
          </Link>
          <button
            onClick={(e) => handleDelete(row.id, e)}
            className="p-1.5 rounded-lg border border-[#262626] bg-[#0A0A0A] text-[#666666] hover:text-[#EF4444] hover:border-[#EF4444]/30 transition-colors"
            title="Delete Log"
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
        <LoadingState type="table" count={6} />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4] overflow-y-auto max-w-7xl mx-auto w-full space-y-8 select-none">
      <Toast message={toastMsg} type="info" onClose={() => setToastMsg('')} />

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-[#262626] pb-6">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-white tracking-tight">My Analyses</h1>
          <p className="text-xs text-[#A3A3A3] mt-1">Manage and review your saved patent novelty evaluations and vector audit history.</p>
        </div>
        <Link to="/new-analysis">
          <Button variant="primary" size="md" icon={Plus}>
            + New Patent Analysis
          </Button>
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <SearchBar
        value={search}
        onChange={setSearch}
        onClear={() => setSearch('')}
        placeholder="Filter analyses by title or domain..."
        filters={
          <>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-[#262626] bg-[#0A0A0A] text-white text-xs outline-none focus:border-white"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Processing">Processing</option>
              <option value="Failed">Failed</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-[#262626] bg-[#0A0A0A] text-white text-xs outline-none focus:border-white"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="noveltyHigh">Sort: Highest Novelty</option>
              <option value="similarityHigh">Sort: Highest Similarity</option>
            </select>
          </>
        }
      />

      {/* Table / Empty State */}
      {sortedReports.length === 0 ? (
        <EmptyState
          title="No patent analyses found"
          description="Try adjusting your search filters or launch a new analysis scan."
          actionLabel="+ New Patent Analysis"
          onAction={() => window.location.href = '/new-analysis'}
        />
      ) : (
        <DataTable
          columns={columns}
          data={sortedReports}
          emptyMessage="No matching analyses found."
        />
      )}

    </div>
  );
}
