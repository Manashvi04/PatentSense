import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { analysisAPI, savedPatentsAPI } from '../utils/api';
import SearchBar from '../components/SearchBar';
import DataTable from '../components/DataTable';
import Button from '../components/Button';
import LoadingState from '../components/LoadingState';
import Toast from '../components/Toast';
import { Bookmark, Eye, Sparkles } from 'lucide-react';

export default function PatentLibrary() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [patents, setPatents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [savedIds, setSavedIds] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    async function loadLibrary() {
      setLoading(true);
      setError('');
      try {
        const [data, saved] = await Promise.all([
          analysisAPI.getPatents(search, selectedDomain),
          savedPatentsAPI.getAll(),
        ]);
        setPatents(data);
        setSavedIds(saved.map((patent) => patent.id));
      } catch (err) {
        setError(err.message || 'Could not load the patent library.');
      } finally {
        setLoading(false);
      }
    }
    loadLibrary();
  }, [search, selectedDomain, retryCount]);

  const toggleSavePatent = async (id) => {
    setBusyId(id);
    try {
      if (savedIds.includes(id)) {
        await savedPatentsAPI.delete(id);
        setSavedIds((items) => items.filter((item) => item !== id));
        setToastMsg('Patent removed from saved library.');
      } else {
        await savedPatentsAPI.save(id);
        setSavedIds((items) => [...items, id]);
        setToastMsg('Patent saved to library.');
      }
    } catch (err) {
      setToastMsg(err.message || 'Could not update saved patents.');
    } finally {
      setBusyId(null);
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
            disabled={busyId === row.id}
            onClick={() => toggleSavePatent(row.id)}
            className={`p-2 rounded-xl border transition-colors ${
              savedIds.includes(row.id)
                ? 'bg-white text-black border-white'
                : 'border-[#262626] bg-[#0A0A0A] text-[#666666] hover:text-white'
            }`}
            title={savedIds.includes(row.id) ? 'Remove saved patent' : 'Save Patent'}
            aria-label={savedIds.includes(row.id) ? 'Remove saved patent' : 'Save Patent'}
          >
            <Bookmark className="w-3.5 h-3.5" />
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
          </select>
        }
      />

      {/* Table */}
      {error ? <div role="alert" className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-sm text-[#FCA5A5]">{error}<button className="ml-3 underline" onClick={() => setRetryCount((count) => count + 1)}>Retry</button></div> : <DataTable columns={columns} data={patents} emptyMessage="No patent publications found matching query." />}

    </div>
  );
}
