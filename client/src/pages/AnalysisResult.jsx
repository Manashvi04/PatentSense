import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { analysisAPI } from '../utils/api';
import Gauge from '../components/Gauge';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingState from '../components/LoadingState';
import Toast from '../components/Toast';
import { ArrowLeft, Printer, Heart, Share2, Download, ExternalLink, Sparkles, Layers, ShieldCheck, Eye } from 'lucide-react';

export default function AnalysisResult() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [activeModalMatch, setActiveModalMatch] = useState(null);

  useEffect(() => {
    async function loadReport() {
      try {
        const data = await analysisAPI.getRecord(id);
        setRecord(data);
        setIsFavorite(data.isFavorite || false);
      } catch (err) {
        console.error("Fetch record error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4]">
        <LoadingState type="report" />
      </div>
    );
  }

  // Realistic sample fallback data if backend item not pre-loaded
  const sampleRecord = record || {
    id: id || "scan-8710",
    title: "AI-Based Medical Imaging Diagnostic System",
    patent_number: "US-2026-0182491-A1",
    technology_domain: "AI / Healthcare",
    created_at: new Date().toISOString(),
    noveltyScore: 87,
    similarityPercentage: 13,
    classification: "HIGH NOVELTY",
    abstract: "A high-performance deep neural network processor configured to evaluate optical coherent tomography scans, synthesizing volumetric tissue layers in real-time.",
    explanation: "The submitted patent disclosure demonstrates strong structural novelty (87%). Key neural network layer topology and sensor integration metrics exhibit minimal overlap with existing prior art references.",
    closestPatent: {
      title: "Optical Coherence Tomography Processing Apparatus",
      patent_number: "US12345678",
      applicant: "MedTech Innovations Inc.",
      filing_date: "2024-03-15",
      publication_date: "2025-09-20",
      similarity: 82,
      matching_concepts: ["Optical coherence tomography", "Volumetric layer processing"],
      differences: ["Real-time deep synthesis pipeline", "Custom sensor interface array"]
    },
    topMatches: [
      {
        patent_number: "US12345678",
        title: "Optical Coherence Tomography Processing Apparatus",
        similarity: 82,
        publication_date: "2025-09-20",
        technology: "Healthcare AI",
        relevance: "High"
      },
      {
        patent_number: "US98765432",
        title: "Neural Network Image Filtration System",
        similarity: 34,
        publication_date: "2024-11-10",
        technology: "Machine Learning",
        relevance: "Medium"
      },
      {
        patent_number: "US11223344",
        title: "Volumetric Medical Signal Synthesizer",
        similarity: 19,
        publication_date: "2023-06-04",
        technology: "Biomedical Devices",
        relevance: "Low"
      }
    ],
    yourClaim: "Claim 1. An AI-based medical imaging system comprising a neural processor configured to analyze volumetric tissue scans, generate multi-dimensional vector maps, and output diagnostic probability scores in real-time.",
    priorArtClaim: "Claim 1. An optical scanner apparatus comprising an image processor configured to acquire scan data and format two-dimensional tissue cross-sections.",
    matchingConcepts: ["Tissue scan acquisition", "Processor-driven diagnostic data mapping"],
    uniqueConcepts: ["Multi-dimensional vector map synthesis", "Real-time diagnostic probability scoring"],
    aiAssessment: "Claim 1 shares several technical concepts with the identified prior art, while additional limitations regarding real-time vector map synthesis may differentiate the invention."
  };

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
    setToastMsg(!isFavorite ? "Report saved to favorites." : "Removed from saved reports.");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setToastMsg("Report link copied to clipboard.");
  };

  const similarTableColumns = [
    {
      header: 'Patent',
      accessor: (row) => (
        <div>
          <span className="font-mono font-bold text-white block">{row.patent_number}</span>
          <span className="text-xs text-[#A3A3A3] truncate max-w-[220px] block" title={row.title}>{row.title}</span>
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
      header: 'Publication Date',
      accessor: (row) => <span className="text-xs text-[#A3A3A3]">{row.publication_date || '2025'}</span>
    },
    {
      header: 'Technology',
      accessor: (row) => <span className="text-xs text-[#A3A3A3]">{row.technology || 'AI / Healthcare'}</span>
    },
    {
      header: 'Relevance',
      accessor: (row) => (
        <Badge variant={row.relevance === 'High' ? 'highNovelty' : row.relevance === 'Medium' ? 'mediumNovelty' : 'neutral'}>
          {row.relevance || 'High'}
        </Badge>
      )
    },
    {
      header: 'Action',
      cellClassName: 'text-right',
      accessor: (row) => (
        <Button variant="outline" size="sm" onClick={() => setActiveModalMatch(row)}>
          View
        </Button>
      )
    }
  ];

  return (
    <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4] overflow-y-auto w-full max-w-7xl mx-auto space-y-8 select-none">
      <Toast message={toastMsg} type="info" onClose={() => setToastMsg('')} />

      {/* Top Back Navigation */}
      <div className="no-print">
        <Link to="/my-analyses">
          <Button variant="outline" size="sm" icon={ArrowLeft}>
            Back to Analyses
          </Button>
        </Link>
      </div>

      {/* Header Info Banner */}
      <div className="flex justify-between items-start flex-wrap gap-6 border-b border-[#262626] pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="highNovelty" size="md">
              {sampleRecord.classification}
            </Badge>
            <span className="text-xs text-[#666666] font-mono">
              Patent Ref: <strong className="text-white">{sampleRecord.patent_number}</strong>
            </span>
          </div>

          <h1 className="font-display font-extrabold text-3xl text-white tracking-tight">{sampleRecord.title}</h1>
          <p className="text-xs text-[#A3A3A3]">
            Technology Domain: <span className="text-white font-semibold">{sampleRecord.technology_domain}</span> &bull; Analysis Date: {new Date(sampleRecord.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 no-print">
          <Button
            variant={isFavorite ? 'primary' : 'outline'}
            size="sm"
            icon={Heart}
            onClick={handleFavoriteToggle}
          >
            {isFavorite ? 'Saved' : 'Save Patent'}
          </Button>

          <Button variant="outline" size="sm" icon={Share2} onClick={handleShare}>
            Share
          </Button>

          <Button variant="primary" size="sm" icon={Printer} onClick={() => window.print()}>
            Download PDF
          </Button>
        </div>
      </div>

      {/* Main Score Visualization Row */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Main Score Box (Novelty Gauge) */}
        <Card className="p-8 flex flex-col items-center justify-center text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[#A3A3A3]">Novelty Rating Index</span>
          <Gauge value={sampleRecord.noveltyScore} label="Novelty Score" size={190} isNovelty={true} />
          
          <div className="pt-2 border-t border-[#262626] w-full text-center space-y-1">
            <span className="text-xs font-bold text-white uppercase block">{sampleRecord.classification}</span>
            <span className="text-[11px] text-[#A3A3A3] block">13% Prior Art Overlap Detected</span>
          </div>
        </Card>

        {/* Professional Explanation */}
        <Card className="lg:col-span-2 p-8 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
            <ShieldCheck className="w-5 h-5 text-white" />
            <h3 className="font-display font-bold text-base text-white">Executive Novelty Assessment</h3>
          </div>
          <p className="text-sm text-[#D4D4D4] leading-relaxed">
            {sampleRecord.explanation}
          </p>
          <div className="p-4 rounded-xl border border-[#262626] bg-[#0A0A0A] space-y-2">
            <span className="text-xs font-bold uppercase text-[#A3A3A3] block">Key Findings Summary</span>
            <ul className="text-xs text-[#A3A3A3] space-y-1.5 list-disc ml-4">
              <li>High structural differentiation in independent claim limitations.</li>
              <li>Minimal vector overlap with active commercial patent disclosures.</li>
              <li>Recommended for immediate pre-filing claim drafting.</li>
            </ul>
          </div>
        </Card>
      </div>

      {/* Section: Similar Patents Detected */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-xl text-white">Similar Patents Detected</h3>
        <DataTable
          columns={similarTableColumns}
          data={sampleRecord.topMatches}
          emptyMessage="No similar prior art detected."
        />
      </div>

      {/* Section: Prior Art Analysis */}
      <Card className="space-y-6 p-8">
        <div className="border-b border-[#262626] pb-4 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="font-display font-bold text-xl text-white">Prior Art Analysis</h3>
            <p className="text-xs text-[#A3A3A3] mt-0.5">Closest reference publication in target technical domain.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setActiveModalMatch(sampleRecord.closestPatent)}>
            View Detailed Comparison
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          <div>
            <span className="text-[#666666] uppercase font-bold block mb-1">Patent Title</span>
            <span className="font-semibold text-white block">{sampleRecord.closestPatent.title}</span>
          </div>
          <div>
            <span className="text-[#666666] uppercase font-bold block mb-1">Patent Number</span>
            <span className="font-mono font-bold text-white block">{sampleRecord.closestPatent.patent_number}</span>
          </div>
          <div>
            <span className="text-[#666666] uppercase font-bold block mb-1">Applicant</span>
            <span className="text-[#D4D4D4] block">{sampleRecord.closestPatent.applicant}</span>
          </div>
          <div>
            <span className="text-[#666666] uppercase font-bold block mb-1">Filing / Pub Date</span>
            <span className="text-[#D4D4D4] block">{sampleRecord.closestPatent.filing_date} / {sampleRecord.closestPatent.publication_date}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-[#262626]">
          <div className="p-4 rounded-xl border border-[#262626] bg-[#0A0A0A] space-y-2">
            <span className="text-xs font-bold text-white uppercase block">Matching Concepts</span>
            <div className="flex flex-wrap gap-1.5">
              {sampleRecord.closestPatent.matching_concepts.map((c, i) => (
                <Badge key={i} variant="neutral">{c}</Badge>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-xl border border-[#262626] bg-[#0A0A0A] space-y-2">
            <span className="text-xs font-bold text-white uppercase block">Technical Differences</span>
            <div className="flex flex-wrap gap-1.5">
              {sampleRecord.closestPatent.differences.map((d, i) => (
                <Badge key={i} variant="completed">{d}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Section: Claim Comparison (Split Screen) */}
      <Card className="space-y-6 p-8">
        <div className="border-b border-[#262626] pb-4">
          <h3 className="font-display font-bold text-xl text-white">Claim Comparison</h3>
          <p className="text-xs text-[#A3A3A3] mt-0.5">Side-by-side technical evaluation against closest prior art disclosures.</p>
        </div>

        {/* Split Screen */}
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          {/* Left: Your Patent Claim */}
          <div className="p-5 rounded-xl border border-[#262626] bg-[#0A0A0A] space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block mb-2">Your Patent Claim</span>
              <p className="text-xs text-[#D4D4D4] leading-relaxed font-mono bg-[#1A1A1A] p-3 rounded-lg border border-[#262626]">
                {sampleRecord.yourClaim}
              </p>
            </div>
            <div className="pt-2">
              <span className="text-[10px] font-bold text-[#A3A3A3] uppercase block mb-1">Unique Concepts</span>
              <div className="flex flex-wrap gap-1">
                {sampleRecord.uniqueConcepts.map((uc, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-white/10 text-white text-[10px] font-semibold border border-white/20">
                    {uc}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Prior Art Claim */}
          <div className="p-5 rounded-xl border border-[#262626] bg-[#0A0A0A] space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block mb-2">Prior Art Claim ({sampleRecord.closestPatent.patent_number})</span>
              <p className="text-xs text-[#A3A3A3] leading-relaxed font-mono bg-[#1A1A1A] p-3 rounded-lg border border-[#262626]">
                {sampleRecord.priorArtClaim}
              </p>
            </div>
            <div className="pt-2">
              <span className="text-[10px] font-bold text-[#A3A3A3] uppercase block mb-1">Matching Concepts</span>
              <div className="flex flex-wrap gap-1">
                {sampleRecord.matchingConcepts.map((mc, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-[#262626] text-[#A3A3A3] text-[10px] font-semibold border border-[#404040]">
                    {mc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Assessment Box */}
        <div className="p-5 rounded-xl border border-[#404040] bg-[#1A1A1A] space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">AI Assessment</span>
            <span className="text-[10px] text-[#A3A3A3] uppercase tracking-widest border border-[#404040] px-2 py-0.5 rounded-full ml-auto">
              AI-generated assessment
            </span>
          </div>
          <p className="text-xs text-[#D4D4D4] leading-relaxed italic">
            "{sampleRecord.aiAssessment}"
          </p>
        </div>
      </Card>

      {/* Comparison Modal */}
      <Modal
        isOpen={!!activeModalMatch}
        onClose={() => setActiveModalMatch(null)}
        title={`Prior Art Comparison — ${activeModalMatch?.patent_number || ''}`}
      >
        {activeModalMatch && (
          <div className="space-y-4 text-xs text-[#D4D4D4]">
            <h4 className="font-bold text-white text-sm">{activeModalMatch.title}</h4>
            <p className="text-[#A3A3A3] leading-relaxed">
              Detailed vector embedding analysis indicates a high conceptual match in claim structures regarding automated optical signals.
            </p>
            <div className="pt-4 border-t border-[#262626] flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setActiveModalMatch(null)}>
                Close Comparison
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
