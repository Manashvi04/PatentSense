import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { analysisAPI } from '../utils/api';
import ScoreCard from '../components/ScoreCard';
import AreaChart from '../components/AreaChart';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Button from '../components/Button';
import LoadingState from '../components/LoadingState';
import { FileText, Award, Layers, ShieldCheck, Plus, ExternalLink, Download, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartFilter, setChartFilter] = useState('30Days');
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

  // Realistic fallback sample data if backend yields empty initial state
  const mockRecentAnalyses = history.length > 0 ? history : [
    {
      id: "scan-101",
      title: "AI-Based Medical Imaging System",
      technology_domain: "AI / Healthcare",
      novelty_score: 91,
      similarity_percentage: 14,
      status: "Completed",
      created_at: "2026-08-14T10:00:00Z"
    },
    {
      id: "scan-102",
      title: "Smart Traffic Prediction Platform",
      technology_domain: "AI / Transportation",
      novelty_score: 78,
      similarity_percentage: 32,
      status: "Completed",
      created_at: "2026-08-13T14:30:00Z"
    },
    {
      id: "scan-103",
      title: "Blockchain Authentication Method",
      technology_domain: "Blockchain / Cyber",
      novelty_score: 84,
      similarity_percentage: 21,
      status: "Processing",
      created_at: "2026-08-12T09:15:00Z"
    },
    {
      id: "scan-104",
      title: "Soft Robotic Sensory Gripper",
      technology_domain: "Robotics & Automation",
      novelty_score: 88,
      similarity_percentage: 16,
      status: "Completed",
      created_at: "2026-08-10T16:20:00Z"
    }
  ];

  // Chart datasets by filter
  const chartDatasets = {
    '7Days': [
      { label: 'Mon', value: 12 }, { label: 'Tue', value: 18 }, { label: 'Wed', value: 14 },
      { label: 'Thu', value: 24 }, { label: 'Fri', value: 31 }, { label: 'Sat', value: 19 }, { label: 'Sun', value: 28 }
    ],
    '30Days': [
      { label: 'Week 1', value: 64 }, { label: 'Week 2', value: 86 },
      { label: 'Week 3', value: 104 }, { label: 'Week 4', value: stats?.totalScans || 128 }
    ],
    '3Months': [
      { label: 'June', value: 210 }, { label: 'July', value: 340 }, { label: 'August', value: 480 }
    ],
    '1Year': [
      { label: 'Q1', value: 450 }, { label: 'Q2', value: 780 }, { label: 'Q3', value: 1120 }, { label: 'Q4', value: 1450 }
    ]
  };

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

      {/* 4 Compact KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ScoreCard
          title="TOTAL ANALYSES"
          value={stats?.totalScans || "128"}
          subtitle="Total patent filings audited"
          change="+12% this month"
          isPositive={true}
          icon={FileText}
        />
        <ScoreCard
          title="NOVELTY CHECKS"
          value="86"
          subtitle="Last 30 days active queries"
          change="+8.2%"
          isPositive={true}
          icon={ShieldCheck}
        />
        <ScoreCard
          title="SIMILAR PATENTS"
          value="1,248"
          subtitle="Across all vector databases"
          change="+142"
          isPositive={true}
          icon={Layers}
        />
        <ScoreCard
          title="AVG. NOVELTY SCORE"
          value={`${stats?.avgNovelty || 82}%`}
          subtitle="Mean uniqueness metric"
          change="+4.8% improvement"
          isPositive={true}
          icon={Award}
        />
      </div>

      {/* Analysis Overview Chart Section */}
      <div className="p-6 rounded-2xl border border-[#262626] bg-[#1A1A1A] space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-[#262626] pb-4">
          <div>
            <h3 className="font-display font-bold text-base text-white">Analysis Overview</h3>
            <p className="text-xs text-[#A3A3A3] mt-0.5">Vector similarity query volume & novelty check distribution.</p>
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl border border-[#262626] bg-[#0A0A0A]">
            {['7Days', '30Days', '3Months', '1Year'].map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setChartFilter(filterKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  chartFilter === filterKey
                    ? 'bg-white text-black font-bold'
                    : 'text-[#A3A3A3] hover:text-white'
                }`}
              >
                {filterKey === '7Days' ? '7 Days' : filterKey === '30Days' ? '30 Days' : filterKey === '3Months' ? '3 Months' : '1 Year'}
              </button>
            ))}
          </div>
        </div>

        <AreaChart data={chartDatasets[chartFilter]} height={180} />
      </div>

      {/* Recent Analyses Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-display font-bold text-lg text-white">Recent Analyses</h3>
          <Link to="/my-analyses" className="text-xs font-semibold text-white hover:underline flex items-center gap-1">
            View All Analyses <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <DataTable
          columns={tableColumns}
          data={mockRecentAnalyses}
          emptyMessage="No patent analyses recorded yet."
        />
      </div>

    </div>
  );
}
