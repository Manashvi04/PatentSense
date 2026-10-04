import React, { useState } from 'react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import { Search, Layers, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { analysisAPI } from '../utils/api';

export default function SimilaritySearch() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setResults(null);
    try {
      // Search real patents from DB by keywords in title/abstract
      const patents = await analysisAPI.getPatents(query.trim(), '');
      setResults(patents);
      if (patents.length === 0) {
        setToastMsg('No patents matched your query. Try different keywords.');
      }
    } catch (err) {
      setToastMsg(`Search error: ${err.message}`);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getSimilarityColor = (title) => {
    // Approximate overlap by checking word matches between query and patent title/abstract
    const qWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const pWords = title.toLowerCase().split(/\s+/);
    const overlap = pWords.filter(w => qWords.has(w)).length;
    const pct = Math.min(95, Math.round((overlap / Math.max(qWords.size, 1)) * 100));
    return pct;
  };

  const columns = [
    {
      header: 'Patent Reference',
      accessor: (row) => (
        <div>
          <span className="font-mono font-bold text-white block">{row.patent_number}</span>
          <span className="text-xs text-[#A3A3A3] truncate max-w-[260px] block" title={row.title}>{row.title}</span>
        </div>
      )
    },
    {
      header: 'Keyword Match',
      accessor: (row) => {
        const pct = getSimilarityColor(row.title + ' ' + row.abstract);
        return (
          <div className="flex items-center gap-3">
            <div className="w-20 h-2 bg-[#262626] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  pct >= 50 ? 'bg-[#EF4444]' : pct >= 25 ? 'bg-[#F59E0B]' : 'bg-[#10B981]'
                }`}
                style={{ width: `${Math.max(pct, 5)}%` }}
              />
            </div>
            <span className="font-bold text-xs text-white">{pct}%</span>
          </div>
        );
      }
    },
    {
      header: 'Technology',
      accessor: (row) => <span className="text-xs text-[#A3A3A3]">{row.category}</span>
    },
    {
      header: 'Filing Date',
      accessor: (row) => <span className="text-xs text-[#666666]">{row.filing_date || '—'}</span>
    },
    {
      header: 'Assignee',
      accessor: (row) => <span className="text-xs text-[#A3A3A3]">{row.assignee || '—'}</span>
    },
    {
      header: 'Action',
      cellClassName: 'text-right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link to={`/patent/${row.patent_number}`}>
            <Button variant="outline" size="sm">
              View
            </Button>
          </Link>
          <Link to="/new-analysis" state={{ initialTitle: row.title }}>
            <Button variant="secondary" size="sm" icon={ArrowRight}>
              Analyze
            </Button>
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4] overflow-y-auto max-w-7xl mx-auto w-full space-y-8 select-none">
      <Toast message={toastMsg} type="info" onClose={() => setToastMsg('')} />

      {/* Header */}
      <div className="border-b border-[#262626] pb-6">
        <h1 className="font-display font-extrabold text-3xl text-white tracking-tight">Similarity Search</h1>
        <p className="text-xs text-[#A3A3A3] mt-1">Search prior art by keywords, titles, or abstract snippets. Results pulled live from the patent database.</p>
      </div>

      {/* Input workspace */}
      <Card className="p-8 space-y-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <Input
            label="Enter patent title, abstract, claim or keywords"
            type="textarea"
            rows={4}
            placeholder="Paste your technical text disclosure or claim paragraph here..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" size="lg" loading={isSearching} icon={Search}>
            {isSearching ? 'Searching...' : 'Search Similar Patents'}
          </Button>
        </form>
      </Card>

      {/* Search Results */}
      {results !== null && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-xl text-white">Prior Art Search Results</h3>
            <span className="text-xs text-[#A3A3A3]">{results.length} reference{results.length !== 1 ? 's' : ''} found</span>
          </div>

          {results.length === 0 ? (
            <EmptyState
              title="No matches found"
              description="Try different keywords or broaden your search terms."
              actionLabel="Clear and try again"
              onAction={() => { setQuery(''); setResults(null); }}
              icon={Layers}
            />
          ) : (
            <DataTable
              columns={columns}
              data={results}
              emptyMessage="No similar prior art publications matched your query."
            />
          )}
        </div>
      )}
    </div>
  );
}
