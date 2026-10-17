import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingState from '../components/LoadingState';
import { analysisAPI, savedPatentsAPI } from '../utils/api';
import { ArrowLeft, User, Calendar, Tag, ShieldCheck, Bookmark } from 'lucide-react';

export default function PatentDetail() {
  const { patentNumber } = useParams();
  const location = useLocation();
  const matchDetails = location.state?.matchDetails;
  
  const [patent, setPatent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadDetails() {
      try {
        const data = await analysisAPI.getPatents(patentNumber);
        const found = data.find((item) => item.patent_number === patentNumber);
        if (!found) throw new Error('This patent is not in the reference library.');
        setPatent(found);
        const saved = await savedPatentsAPI.check(found.id);
        setIsSaved(saved.isSaved);
      } catch (err) {
        setError(err.message || 'Could not load patent details.');
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [patentNumber]);

  const toggleSaved = async () => {
    if (!patent) return;
    setSaving(true);
    try {
      if (isSaved) await savedPatentsAPI.delete(patent.id);
      else await savedPatentsAPI.save(patent.id);
      setIsSaved(!isSaved);
    } catch (err) {
      setActionError(err.message || 'Could not update saved status.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4]">
        <LoadingState type="report" />
      </div>
    );
  }

  if (error || !patent) return <div className="flex-1 p-8 text-[#D4D4D4]"><Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => window.history.back()}>Back</Button><p role="alert" className="mt-6 text-sm text-[#FCA5A5]">{error || 'Patent not found.'}</p></div>;

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
          <Button variant={isSaved ? 'primary' : 'outline'} size="sm" icon={Bookmark} loading={saving} onClick={toggleSaved}>{isSaved ? 'Saved' : 'Save Patent'}</Button>
        </div>

        <div className="flex flex-wrap gap-6 text-xs text-[#A3A3A3] font-medium">
          <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-white" /> Inventors: <strong className="text-white">{patent.inventors || 'Not provided'}</strong></span>
          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-white" /> Filing Date: <strong className="text-white">{patent.filing_date || 'Not provided'}</strong></span>
          <span className="flex items-center gap-1.5"><Tag className="w-4 h-4 text-white" /> Category: <strong className="text-white">{patent.category || 'Uncategorized'}</strong></span>
        </div>
        {actionError && <p role="alert" className="text-sm text-[#FCA5A5]">{actionError}</p>}
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
                <strong className="text-sm text-white">{matchDetails.similarities?.title ?? 0}%</strong>
            </div>
            <div>
              <span className="text-[#666666] text-[10px] block uppercase tracking-wider mb-0.5">Abstract Match</span>
                <strong className="text-sm text-white">{matchDetails.similarities?.abstract ?? 0}%</strong>
            </div>
            <div>
              <span className="text-[#666666] text-[10px] block uppercase tracking-wider mb-0.5">Description Match</span>
                <strong className="text-sm text-white">{matchDetails.similarities?.description ?? 0}%</strong>
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
            <p className="text-sm text-[#A3A3A3]">The reference library does not include the published claims text for this patent.</p>
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
