import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { analysisAPI } from '../utils/api';
import Gauge from '../components/Gauge';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import LoadingState from '../components/LoadingState';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';

export default function AnalysisResult() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    analysisAPI.getRecord(id)
      .then((data) => { if (active) setRecord(data); })
      .catch((requestError) => { if (active) setError(requestError.message || 'Unable to load this analysis report.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4]"><LoadingState type="report" /></div>;
  }

  if (error || !record) {
    return (
      <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4] max-w-4xl mx-auto w-full">
        <Card className="p-8 space-y-4">
          <h1 className="font-display font-bold text-xl text-white">Report unavailable</h1>
          <p className="text-sm text-[#A3A3A3]">{error || 'This analysis report could not be found.'}</p>
          <Link to="/my-analyses"><Button variant="outline" size="sm" icon={ArrowLeft}>Back to Analyses</Button></Link>
        </Card>
      </div>
    );
  }

  const matches = Array.isArray(record.topMatches) ? record.topMatches : [];
  const closestPatent = record.closestPatent || matches[0] || {};
  const noveltyScore = Math.max(0, Math.min(100, Number(record.noveltyScore) || 0));
  const similarityPercentage = Math.max(0, Math.min(100, Number(record.similarityPercentage) || 0));
  const classification = noveltyScore >= 70 ? 'LOWER CORPUS SIMILARITY' : noveltyScore >= 40 ? 'REVIEW OVERLAP' : 'HIGH CORPUS SIMILARITY';

  const columns = [
    {
      header: 'Patent reference',
      accessor: (match) => (
        <div>
          <span className="font-mono font-bold text-white block">{match.patent_number || 'Reference patent'}</span>
          <span className="text-xs text-[#A3A3A3] block">{match.title || 'Untitled patent'}</span>
        </div>
      ),
    },
    {
      header: 'Embedding similarity',
      accessor: (match) => <span className="font-bold text-white">{Math.max(0, Math.min(100, Number(match.similarity ?? match.similarities?.overall) || 0))}%</span>,
    },
    { header: 'Technology', accessor: (match) => <span className="text-xs text-[#A3A3A3]">{match.category || 'Unspecified'}</span> },
    {
      header: 'Details',
      accessor: (match) => match.patent_number ? <Link className="inline-flex items-center gap-1 text-white" to={`/patent/${match.patent_number}`}>Open <ExternalLink size={13} /></Link> : null,
    },
  ];

  return (
    <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4] overflow-y-auto w-full max-w-7xl mx-auto space-y-8">
      <Link to="/my-analyses"><Button variant="outline" size="sm" icon={ArrowLeft}>Back to Analyses</Button></Link>

      <div className="border-b border-[#262626] pb-6">
        <div className="flex items-center gap-3 mb-3"><Badge variant={noveltyScore >= 70 ? 'highNovelty' : noveltyScore >= 40 ? 'mediumNovelty' : 'neutral'}>{classification}</Badge><span className="text-xs text-[#666666]">Analysis #{record.id}</span></div>
        <h1 className="font-display font-extrabold text-3xl text-white">{record.title}</h1>
        <p className="text-xs text-[#A3A3A3] mt-2">{record.technologyDomain || 'Technology domain not set'} · {record.created_at ? new Date(record.created_at).toLocaleDateString() : 'Date unavailable'}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <Card className="p-7 flex flex-col items-center text-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#A3A3A3]">Corpus novelty screening index</span>
          <Gauge value={noveltyScore} label="Screening index" size={180} isNovelty />
          <span className="text-xs text-[#A3A3A3]">Highest embedding similarity: {similarityPercentage}%</span>
        </Card>
        <Card className="lg:col-span-2 p-7 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#262626] pb-3"><ShieldCheck className="w-5 h-5 text-white" /><h2 className="font-display font-bold text-base text-white">Screening guidance</h2></div>
          <p className="text-sm text-[#D4D4D4] leading-relaxed">{record.noveltyGuidance || record.aiSummary}</p>
          <p className="text-xs text-[#777777]">The novelty screening index is calculated as 100 minus the highest embedding similarity in this reference set. It is not a legal opinion or a patentability determination.</p>
        </Card>
      </div>

      <section className="space-y-4">
        <div><h2 className="font-display font-bold text-xl text-white">Ranked references</h2><p className="text-xs text-[#A3A3A3] mt-1">Sorted by embedding cosine similarity within the available patent library.</p></div>
        <DataTable columns={columns} data={matches} emptyMessage="No patent met the similarity threshold for this analysis." />
      </section>

      {closestPatent.title && (
        <Card className="p-7 space-y-3">
          <h2 className="font-display font-bold text-lg text-white">Closest reference</h2>
          <p className="text-sm font-semibold text-[#D4D4D4]">{closestPatent.title}</p>
          <p className="text-xs text-[#A3A3A3]">{closestPatent.patent_number || 'Patent number unavailable'} · {closestPatent.category || 'Technology category unavailable'} · Filed {closestPatent.filing_date || 'date unavailable'}</p>
          {closestPatent.abstract && <p className="text-sm text-[#A3A3A3] leading-relaxed">{closestPatent.abstract}</p>}
        </Card>
      )}
    </div>
  );
}
