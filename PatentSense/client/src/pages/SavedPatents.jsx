import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import { Bookmark, Eye, Trash2, Plus } from 'lucide-react';

export default function SavedPatents() {
  const [savedPatents, setSavedPatents] = useState([
    {
      id: "pat-101",
      patent_number: "US-11928401-B2",
      title: "Deep Learning Medical Tomography Diagnostic System",
      category: "Artificial Intelligence",
      saved_date: "2026-08-10",
      novelty: 89,
      similarity: 11
    },
    {
      id: "pat-102",
      patent_number: "US-12049281-A1",
      title: "Solid-State Electrolyte Battery Separator Layer",
      category: "Green Energy & CleanTech",
      saved_date: "2026-08-12",
      novelty: 94,
      similarity: 6
    }
  ]);
  const [toastMsg, setToastMsg] = useState('');

  const handleRemove = (id) => {
    setSavedPatents(savedPatents.filter(p => p.id !== id));
    setToastMsg("Patent removed from saved list.");
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
      header: 'Saved Date',
      accessor: (row) => <span className="text-xs text-[#666666]">{row.saved_date}</span>
    },
    {
      header: 'Novelty Score',
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

  return (
    <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4] overflow-y-auto max-w-7xl mx-auto w-full space-y-8 select-none">
      <Toast message={toastMsg} type="info" onClose={() => setToastMsg('')} />

      {/* Header */}
      <div className="border-b border-[#262626] pb-6">
        <h1 className="font-display font-extrabold text-3xl text-white tracking-tight">Saved Patents</h1>
        <p className="text-xs text-[#A3A3A3] mt-1">Bookmarked prior art references and saved analysis reports.</p>
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
