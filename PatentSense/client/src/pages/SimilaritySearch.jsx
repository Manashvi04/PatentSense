import React, { useState } from 'react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { analysisAPI } from '../utils/api';
export default function SimilaritySearch() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [retrievalMethod, setRetrievalMethod] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError('');
    setResults(null);
    setRetrievalMethod('');
    try {
      const data = await analysisAPI.searchSimilar(query);
      if (!Array.isArray(data.results)) throw new Error('The similarity service returned an unexpected response.');
      setResults(data.results.map((item) => ({
        ...item,
        similarity: Number.isFinite(Number(item.similarity)) ? Math.max(0, Math.min(100, Number(item.similarity))) : 0,
        technology: item.technology || item.category || 'Uncategorized',
        publication_date: item.publication_date || item.filing_date || '—',
        matching_concepts: Array.isArray(item.matching_concepts) ? item.matching_concepts : [],
      })));
      setRetrievalMethod(data.retrievalMethod || '');
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Similarity search could not be completed.');
    } finally {
      setIsSearching(false);
    }
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
      header: 'Similarity',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-20 h-2 bg-[#262626] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                row.similarity >= 50 ? 'bg-[#EF4444]' : row.similarity >= 30 ? 'bg-[#F59E0B]' : 'bg-[#10B981]'
              }`}
              style={{ width: `${row.similarity}%` }}
            />
          </div>
          <span className="font-bold text-xs text-white">{row.similarity}%</span>
        </div>
      )
    },
    {
      header: 'Technology',
      accessor: (row) => <span className="text-xs text-[#A3A3A3]">{row.technology}</span>
    },
    {
      header: 'Publication Date',
      accessor: (row) => <span className="text-xs text-[#666666]">{row.publication_date}</span>
    },
    {
      header: 'Matching Concepts',
      accessor: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.matching_concepts.map((mc, i) => (
            <Badge key={i} variant="neutral">{mc}</Badge>
          ))}
        </div>
      )
    },
    {
      header: 'Action',
      cellClassName: 'text-right',
      accessor: (row) => (
        <Link to={`/patent/${row.patent_number}`}>
          <Button variant="outline" size="sm">
            View
          </Button>
        </Link>
      )
    }
  ];

  return (
    <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4] overflow-y-auto max-w-7xl mx-auto w-full space-y-8 select-none">
      {/* Header */}
      <div className="border-b border-[#262626] pb-6">
        <h1 className="font-display font-extrabold text-3xl text-white tracking-tight">Similarity Search</h1>
        <p className="text-xs text-[#A3A3A3] mt-1">Dedicated semantic search workspace to scan prior art overlap percentages.</p>
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

      {error && <div role="alert" className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-sm text-[#FCA5A5]">{error}</div>}

      {/* Search Results */}
      {results && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-xl text-white">Prior Art Similarity Matches</h3>
            <span className="text-xs text-[#A3A3A3]">{results.length} relevant references returned{retrievalMethod ? ` · ${retrievalMethod}` : ''}</span>
          </div>

          <DataTable
            columns={columns}
            data={results}
            emptyMessage="No similar prior art publications matched your query."
          />
        </div>
      )}
    </div>
  );
}
