import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { analysisAPI } from '../utils/api';
import ScoreCard from '../components/ScoreCard';
import AreaChart from '../components/AreaChart';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Button from '../components/Button';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import { FileText, Award, Layers, ShieldCheck, Plus, ExternalLink, Download, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartFilter, setChartFilter] = useState('7Days');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsData, historyData] = await Promise.all([
          analysisAPI.getStats(),
          analysisAPI.getHistory()
        ]);
        setStats(statsData);
        setHistory(historyData);
      } catch (err) {
        console.error("Dashboard metrics fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-8 space-y-8 bg-[#000000] text-[#D4D4D4] max-w-7xl mx-auto w-full">
        <LoadingState type="cards" count={4} />
        <LoadingState type="table" count={5} />
      </div>
    );
  }

  // Use real data for chart based on filter
  const getChartData = () => {
    if (!stats) return [];
    if (chartFilter === '7Days') return stats.weeklyTrend || [];
    if (chartFilter === '30Days') return stats.monthlyTrend || [];
    // Flatten monthly trend into quarterly/yearly buckets for display
    if (chartFilter === '3Months') {
      const monthly = stats.monthlyTrend || [];
      const weeks = [];
      for (let i = 0; i < monthly.length; i += 7) {
        const chunk = monthly.slice(i, i + 7);
        const total = chunk.reduce((s, d) => s + d.value, 0);
        weeks.push({ label: chunk[0]?.label || `Week ${Math.floor(i / 7) + 1}`, value: total });
      }
      return weeks;
    }
    if (chartFilter === '1Year') {
      const monthly = stats.monthlyTrend || [];
      const val = monthly.reduce((s, d) => s + d.value, 0);
      return [
        { label: 'This Month', value: val }
      ];
    }
    return [];
  };

  const chartData = getChartData();

  const getNoveltyVariant = (score) => {
    if (score >= 75) return 'highNovelty';
    if (score >= 45) return 'mediumNovelty';
    return 'lowNovelty';
  };

  const tableColumns = [
    {
      header: 'Patent / Analysis',
      accessor: (row) => (
        <div>
          <span className="font-semibold text-white block max-w-[240px] truncate" title={row.title}>{row.title}</span>
          <span className="text-[10px] text-[#666666] font-mono">ID: PS-{row.id}</span>
        </div>
      )
    },
    {
      header: 'Technology',
      accessor: (row) => (
        <span className="text-xs text-[#A3A3A3] font-medium">{row.technology_domain || 'AI Research'}</span>
      )
    },
    {
      header: 'Novelty Score',
      accessor: (row) => (
        <Badge variant={getNoveltyVariant(row.novelty_score)}>
          {row.novelty_score}%
        </Badge>
      )
    },
    {
      header: 'Similarity',
      accessor: (row) => (
        <span className="text-xs font-bold text-white">{row.similarity_percentage}%</span>
      )
    },
    {
      header: 'Date',
      accessor: (row) => (
        <span className="text-xs text-[#666666]">
          {new Date(row.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
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
            onClick={() => window.print()}
            title="Download PDF"
            className="p-1.5 rounded-lg border border-[#262626] bg-[#0A0A0A] text-[#A3A3A3] hover:text-white hover:border-[#404040]"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  // Compute novelty checks (analyses in last 30 days)
  const noveltyChecks30d = history.filter(h => {
    const d = new Date(h.created_at);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return d >= cutoff;
  }).length;

  return (
    <div className="flex-1 p-8 space-y-8 bg-[#000000] text-[#D4D4D4] overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-[#262626] pb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">IP Intelligence Dashboard</h1>
          <p className="text-xs text-[#A3A3A3] mt-1">Review comparative scores, analyze novelty ratios, and access saved reports.</p>
        </div>
        <Link to="/new-analysis">
          <Button variant="primary" size="md" icon={Plus}>
            + New Patent Analysis
          </Button>
        </Link>
      </div>

      {/* 4 Compact KPI Cards — all real data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ScoreCard
          title="TOTAL ANALYSES"
          value={stats?.totalScans ?? 0}
          subtitle="Total patent filings audited"
          change={`${stats?.distribution?.high ?? 0} high novelty`}
          isPositive={true}
          icon={FileText}
        />
        <ScoreCard
          title="NOVELTY CHECKS"
          value={noveltyChecks30d}
          subtitle="Last 30 days active queries"
          change={`${stats?.totalFavorites ?? 0} saved`}
          isPositive={true}
          icon={ShieldCheck}
        />
        <ScoreCard
          title="PATENT MATCHES"
          value={stats?.distribution ? (stats.distribution.high + stats.distribution.medium + stats.distribution.low) : 0}
          subtitle="Total similarity evaluations"
          change={`${stats?.distribution?.low ?? 0} unique / novel`}
          isPositive={true}
          icon={Layers}
        />
        <ScoreCard
          title="AVG. NOVELTY SCORE"
          value={`${stats?.avgNovelty ?? 0}%`}
          subtitle="Mean uniqueness metric"
          change={stats?.avgNovelty >= 70 ? 'Strong portfolio' : 'Review needed'}
          isPositive={(stats?.avgNovelty ?? 0) >= 70}
          icon={Award}
        />
      </div>

      {/* Analysis Overview Chart Section — real DB trends */}
      <div className="p-6 rounded-2xl border border-[#262626] bg-[#1A1A1A] space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-[#262626] pb-4">
          <div>
            <h3 className="font-display font-bold text-base text-white">Analysis Activity Overview</h3>
            <p className="text-xs text-[#A3A3A3] mt-0.5">Real-time patent scan volume from your analysis history.</p>
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl border border-[#262626] bg-[#0A0A0A]">
            {['7Days', '30Days'].map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setChartFilter(filterKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  chartFilter === filterKey
                    ? 'bg-white text-black font-bold'
                    : 'text-[#A3A3A3] hover:text-white'
                }`}
              >
                {filterKey === '7Days' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>

        {chartData.length > 0 ? (
          <AreaChart data={chartData} height={180} />
        ) : (
          <div className="h-[180px] flex items-center justify-center text-xs text-[#555555]">
            No analysis activity in this period yet. <Link to="/new-analysis" className="ml-1 underline text-white">Run your first analysis →</Link>
          </div>
        )}
      </div>

      {/* Recent Analyses Table — real data only */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-display font-bold text-lg text-white">Recent Analyses</h3>
          <Link to="/my-analyses" className="text-xs font-semibold text-white hover:underline flex items-center gap-1">
            View All Analyses <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {history.length === 0 ? (
          <EmptyState
            title="No patent analyses yet"
            description="Submit your first patent for novelty analysis to see results here."
            actionLabel="+ New Patent Analysis"
            onAction={() => navigate('/new-analysis')}
            icon={FileText}
          />
        ) : (
          <DataTable
            columns={tableColumns}
            data={history.slice(0, 5)}
            emptyMessage="No patent analyses recorded yet."
          />
        )}
      </div>

    </div>
  );
}
