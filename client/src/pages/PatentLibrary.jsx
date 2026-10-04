import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { analysisAPI, savedPatentsAPI } from '../utils/api';
import SearchBar from '../components/SearchBar';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Button from '../components/Button';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import { BookOpen, Bookmark, Eye, Sparkles } from 'lucide-react';

export default function PatentLibrary() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [patents, setPatents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [savedIds, setSavedIds] = useState(new Set());
  const [toastMsg, setToastMsg] = useState('');

  // Load patents and saved-status
  useEffect(() => {
    async function loadLibrary() {
      setLoading(true);
      try {
        const [patentsData, savedData] = await Promise.all([
          analysisAPI.getPatents(search, selectedDomain),
          savedPatentsAPI.getAll()
        ]);
        setPatents(patentsData || []);
        // Build a Set of saved patent IDs for O(1) lookup
        setSavedIds(new Set((savedData || []).map(p => p.id)));
      } catch (err) {
        console.error('Library fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLibrary();
  }, [search, selectedDomain]);

  const toggleSavePatent = async (patent) => {
    const isSaved = savedIds.has(patent.id);
    try {
      if (isSaved) {
        await savedPatentsAPI.remove(patent.id);
        setSavedIds(prev => {
          const next = new Set(prev);
          next.delete(patent.id);
          return next;
        });
        setToastMsg('Patent removed from saved library.');
      } else {
        await savedPatentsAPI.save(patent.id);
        setSavedIds(prev => new Set([...prev, patent.id]));
        setToastMsg('Patent saved to library.');
      }
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
      header: 'Technology',
      accessor: (row) => <span className="text-xs text-[#A3A3A3]">{row.category || row.technology_domain}</span>
    },
    {
      header: 'Filing Date',
      accessor: (row) => <span className="text-xs text-[#666666]">{row.filing_date}</span>
    },
    {
      header: 'Assignee',
      accessor: (row) => <span className="text-xs text-[#A3A3A3]">{row.assignee || '—'}</span>
    },
    {
      header: 'Actions',
      cellClassName: 'text-right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link to={`/patent/${row.patent_number}`}>
            <Button variant="outline" size="sm" icon={Eye}>
              Open
            </Button>
          </Link>
          <Link to="/new-analysis" state={{ initialTitle: row.title }}>
            <Button variant="secondary" size="sm" icon={Sparkles}>
              Analyze
            </Button>
          </Link>
          <button
            onClick={() => toggleSavePatent(row)}
            className={`p-2 rounded-xl border transition-colors ${
              savedIds.has(row.id)
                ? 'bg-white text-black border-white'
                : 'border-[#262626] bg-[#0A0A0A] text-[#666666] hover:text-white'
            }`}
            title={savedIds.has(row.id) ? 'Remove from saved' : 'Save Patent'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${savedIds.has(row.id) ? 'fill-current' : ''}`} />
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
        <h1 className="font-display font-extrabold text-3xl text-white tracking-tight">Patent Library</h1>
        <p className="text-xs text-[#A3A3A3] mt-1">Search, inspect, and benchmark global prior art publications across technology domains.</p>
      </div>

      {/* Search & Filters */}
      <SearchBar
        value={search}
        onChange={setSearch}
        onClear={() => setSearch('')}
        placeholder="Search patents by title, number, technology or keyword..."
        filters={
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[#262626] bg-[#0A0A0A] text-white text-xs outline-none focus:border-white"
          >
            <option value="">All Technologies</option>
            <option value="Artificial Intelligence">Artificial Intelligence</option>
            <option value="Biotechnology & Healthcare">Biotechnology & Healthcare</option>
            <option value="Green Energy & CleanTech">Green Energy & CleanTech</option>
            <option value="Robotics & Automation">Robotics & Automation</option>
            <option value="Blockchain & Cyber Security">Blockchain & Cyber Security</option>
          </select>
        }
      />

      {/* Table */}
      {patents.length === 0 ? (
        <EmptyState
          title="No patents found"
          description={search || selectedDomain ? "Try different search terms or clear filters." : "The patent database appears to be empty. Please seed it."}
          actionLabel={search || selectedDomain ? "Clear Filters" : null}
          onAction={search || selectedDomain ? () => { setSearch(''); setSelectedDomain(''); } : undefined}
          icon={BookOpen}
        />
      ) : (
        <DataTable
          columns={columns}
          data={patents}
          emptyMessage="No patent publications found matching query."
        />
      )}

    </div>
  );
}
