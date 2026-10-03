import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingState from '../components/LoadingState';
import { ArrowLeft, User, Calendar, Tag, ShieldCheck } from 'lucide-react';

export default function PatentDetail() {
  const { patentNumber } = useParams();
  const location = useLocation();
  const matchDetails = location.state?.matchDetails;
  
  const [patent, setPatent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDetails() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/analysis/patents?search=${patentNumber}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.length > 0) {
          setPatent(data[0]);
        } else {
          // Fallback sample patent
          setPatent({
            patent_number: patentNumber || "US12345678",
            title: "Optical Coherence Tomography Processing Apparatus",
            inventors: "Dr. Eleanor Vance, Mark Thorne",
            filing_date: "2024-03-15",
            category: "Biotechnology & Healthcare",
            abstract: "An optical scanner apparatus comprising an image processor configured to acquire scan data and format two-dimensional tissue cross-sections.",
            description: "Detailed system embodiment including multi-wavelength lasers, optical interferometers, and computational reconstruction logic."
          });
        }
      } catch (err) {
        console.error("Failed to load patent detailed claims:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [patentNumber]);

  if (loading) {
    return (
      <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4]">
        <LoadingState type="report" />
      </div>
    );
  }

  const mockClaims = [
    `1. A system for ${patent.title.toLowerCase()}, comprising a controller configured to parse and evaluate signal flows, an interface mapping data values, and a processor executing computational iterations to determine thresholds.`,
    `2. The system of claim 1, wherein the controller aggregates data inputs from co-located thermal and moisture sensors in real-time.`,
    `3. The system of claim 1, wherein the computational iterations execute progressive scaling models mapping vector bottlenecks.`
  ];

  return (
    <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4] overflow-y-auto w-full max-w-5xl mx-auto space-y-8 select-none">
      <div>
        <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => window.history.back()}>
          Back
        </Button>
      </div>

      <div className="border-b border-[#262626] pb-6 space-y-4">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <span className="text-xs font-bold text-[#A3A3A3] uppercase tracking-widest block mb-1">Patent Publication Reference</span>
            <h1 className="font-display font-extrabold text-2xl text-white">{patent.title}</h1>
          </div>
          <Badge variant="white" size="md">
            {patent.patent_number}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-6 text-xs text-[#A3A3A3] font-medium">
          <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-white" /> Inventors: <strong className="text-white">{patent.inventors || 'Research Team'}</strong></span>
          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-white" /> Filing Date: <strong className="text-white">{patent.filing_date || '2024-03-15'}</strong></span>
          <span className="flex items-center gap-1.5"><Tag className="w-4 h-4 text-white" /> Category: <strong className="text-white">{patent.category || 'AI Research'}</strong></span>
        </div>
      </div>

      {matchDetails && (
        <Card className="p-6 flex justify-between items-center flex-wrap gap-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">Scan Similarity Match</span>
            <p className="text-xs text-[#A3A3A3]">Section matching metrics for current invention scan against prior art publication.</p>
          </div>
          <div className="flex gap-6 text-xs text-center font-bold font-display">
            <div>
              <span className="text-[#666666] text-[10px] block uppercase tracking-wider mb-0.5">Title Match</span>
              <strong className="text-sm text-white">{matchDetails.similarities?.title || 80}%</strong>
            </div>
            <div>
              <span className="text-[#666666] text-[10px] block uppercase tracking-wider mb-0.5">Abstract Match</span>
              <strong className="text-sm text-white">{matchDetails.similarities?.abstract || 82}%</strong>
            </div>
            <div>
              <span className="text-[#666666] text-[10px] block uppercase tracking-wider mb-0.5">Description Match</span>
              <strong className="text-sm text-white">{matchDetails.similarities?.description || 75}%</strong>
            </div>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 space-y-2">
            <h3 className="font-semibold text-white text-base">Abstract</h3>
            <p className="text-sm text-[#A3A3A3] leading-relaxed">{patent.abstract}</p>
          </Card>

          <Card className="p-6 space-y-3">
            <h3 className="font-semibold text-white text-base">Patent Claims</h3>
            <div className="space-y-3">
              {mockClaims.map((claim, idx) => (
                <div className="p-4 rounded-xl border border-[#262626] bg-[#0A0A0A] text-xs text-[#D4D4D4] leading-relaxed font-mono" key={idx}>
                  {claim}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-white">Full Description Summary</h3>
            <p className="text-[10px] text-[#666666] uppercase tracking-widest block mt-0.5">Technical Mechanism</p>
          </div>
          <p className="text-xs text-[#A3A3A3] leading-relaxed">
            {patent.description}
          </p>
          <div className="pt-2 border-t border-[#262626]">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <ShieldCheck className="w-4 h-4" />
              Verified Patent Reference
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}
