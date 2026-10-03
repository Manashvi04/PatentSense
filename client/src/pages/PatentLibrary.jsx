import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { analysisAPI } from '../utils/api';
import SearchBar from '../components/SearchBar';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Button from '../components/Button';
import LoadingState from '../components/LoadingState';
import Toast from '../components/Toast';
import { BookOpen, Bookmark, Eye, Layers, Sparkles } from 'lucide-react';

export default function PatentLibrary() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [patents, setPatents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [savedIds, setSavedIds] = useState([]);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    async function loadLibrary() {
      try {
        const data = await analysisAPI.getPatents(search, selectedDomain);
        setPatents(data || []);
      } catch (err) {
        console.error("Library fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLibrary();
  }, [search, selectedDomain]);

  const toggleSavePatent = (id) => {
    if (savedIds.includes(id)) {
      setSavedIds(savedIds.filter(item => item !== id));
      setToastMsg("Patent removed from saved library.");
    } else {
      setSavedIds([...savedIds, id]);
      setToastMsg("Patent saved to library.");
    }
  };

  const samplePatents = patents.length > 0 ? patents : [
    {
      id: "pat-1",
      patent_number: "US-11928401-B2",
      title: "Deep Learning Medical Tomography Diagnostic System",
      category: "Artificial Intelligence",
      filing_date: "2024-02-18",
      novelty: 89,
      similarity: 11
    },
    {
      id: "pat-2",
      patent_number: "US-10829102-B1",
      title: "Autonomous Vehicular Sensor Fusion Strategy",
      category: "Robotics & Automation",
      filing_date: "2023-11-04",
      novelty: 76,
      similarity: 24
    },
    {
      id: "pat-3",
      patent_number: "US-12049281-A1",
      title: "Solid-State Electrolyte Battery Separator Layer",
      category: "Green Energy & CleanTech",
      filing_date: "2025-01-12",
      novelty: 94,
      similarity: 6
    },
    {
      id: "pat-4",
      patent_number: "US-10492819-B2",
      title: "Decentralized Zero-Knowledge Cryptographic Protocol",
      category: "Blockchain & Cyber Security",
      filing_date: "2024-08-30",
      novelty: 82,
      similarity: 18
    }
  ];

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
      header: 'Novelty Rating',
      accessor: (row) => (
        <Badge variant={row.novelty >= 75 ? 'highNovelty' : 'mediumNovelty'}>
          {row.novelty}%
        </Badge>
      )
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
            onClick={() => toggleSavePatent(row.id)}
            className={`p-2 rounded-xl border transition-colors ${
              savedIds.includes(row.id)
                ? 'bg-white text-black border-white'
                : 'border-[#262626] bg-[#0A0A0A] text-[#666666] hover:text-white'
            }`}
            title="Save Patent"
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
      <DataTable
        columns={columns}
        data={samplePatents}
        emptyMessage="No patent publications found matching query."
      />

    </div>
  );
}
