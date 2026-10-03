import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { analysisAPI } from '../utils/api';
import Gauge from '../components/Gauge';
import { ArrowLeft, Printer, Shield, Copy, Check } from 'lucide-react';

export default function Report() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadRecord() {
      try {
        const data = await analysisAPI.getRecord(id);
        setRecord(data);
      } catch (err) {
        setError('Failed to load report. The record may have been deleted or is inaccessible.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadRecord();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      let trimmed = line.trim();
      if (trimmed.startsWith('### ')) {
        return <h3 key={idx} style={{ marginTop: '1.5rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{trimmed.replace('### ', '')}</h3>;
      }
      if (trimmed.startsWith('#### ')) {
        return <h4 key={idx} style={{ marginTop: '1.25rem', marginBottom: '0.5rem', color: 'var(--accent-secondary)' }}>{trimmed.replace('#### ', '')}</h4>;
      }
      if (trimmed.startsWith('- ')) {
        const content = trimmed.replace('- ', '');
        return (
          <li key={idx} style={{ marginLeft: '1.25rem', listStyleType: 'disc', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
            {parseBold(content)}
          </li>
        );
      }
      if (trimmed === '') {
        return <div key={idx} style={{ height: '0.75rem' }} />;
      }
      return <p key={idx} style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>{parseBold(trimmed)}</p>;
    });
  };

  const parseBold = (text) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} style={{ color: 'var(--text-primary)' }}>{part}</strong>;
      }
      const italicParts = part.split(/\*(.*?)\*/g);
      return italicParts.map((ipart, j) => {
        if (j % 2 === 1) return <em key={j} style={{ color: 'var(--text-primary)' }}>{ipart}</em>;
        return ipart;
      });
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="scanning-visual" style={{ width: '80px', height: '80px', margin: 0 }}>
          <div className="scanning-line" />
          <div className="scanning-grid" />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Generating legal assessment report...</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="main-content" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--color-danger)', marginBottom: '1rem' }}>Report Error</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{error}</p>
        <Link to="/" className="btn btn-secondary">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="main-content animate-fade-in">
      <div className="no-print" style={{ marginBottom: '1.5rem' }}>
        <Link to="/" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={14} />
          <span>Dashboard</span>
        </Link>
      </div>

      <div className="report-header">
        <div>
          <span className="badge badge-info" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>AI Semantic Evaluation</span>
          <h1 className="gradient-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{record.title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Report ID: <span style={{ fontFamily: 'monospace' }}>PS-{record.id}</span> &bull; Scanned on {new Date(record.created_at).toLocaleString()}
          </p>
        </div>
        <div className="no-print" style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleCopy}>
            {copied ? <Check size={16} style={{ color: 'var(--color-success)' }} /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Metrics & Markdown summary */}
      <div className="report-summary-layout">
        <div className="card gauge-panel">
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', width: '100%', paddingBottom: '0.5rem', textAlign: 'center' }}>
            Calculated Indices
          </h3>
          <Gauge value={record.noveltyScore} label="Novelty Rating" isNovelty={true} />
          <Gauge value={record.similarityPercentage} label="Similarity Index" isNovelty={false} />
          
          <div style={{ textAlign: 'center', marginTop: '1rem', width: '100%' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Closest Prior Art Match</div>
              <div style={{ fontWeight: 700, marginTop: '0.25rem', fontSize: '0.95rem' }} className="brand-gradient">{record.closestPatent.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>({record.closestPatent.patent_number})</div>
            </div>
          </div>
        </div>

        <div className="card report-text-panel">
          {renderMarkdown(record.aiSummary)}
        </div>
      </div>

      {/* Matched Prior Art Profiles */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={22} style={{ color: 'var(--accent-primary)' }} />
          Prior Art Match Details & Similarity Breakdown
        </h2>
        <div className="patents-list">
          {record.topMatches.map((match, i) => (
            <div className="card patent-result-card" key={i}>
              <div className="patent-card-header">
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{match.title}</h3>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>Patent No: <strong style={{ color: 'var(--text-primary)' }}>{match.patent_number}</strong></span>
                    <span>Category: <strong style={{ color: 'var(--text-primary)' }}>{match.category}</strong></span>
                    <span>Filing Date: {match.filing_date}</span>
                  </div>
                </div>
                <span className={`badge ${match.similarities.overall >= 55 ? 'badge-low' : match.similarities.overall >= 25 ? 'badge-medium' : 'badge-high'}`}>
                  {match.similarities.overall}% Similar
                </span>
              </div>
              
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: '1.6' }}>
                <strong>Abstract:</strong> {match.abstract}
              </p>
              
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Overlap Keywords</span>
                  <div className="chips-container" style={{ margin: 0 }}>
                    {match.overlapTerms.map((term, idx) => (
                      <span className="chip chip-overlap" key={idx}>{term}</span>
                    ))}
                    {match.overlapTerms.length === 0 && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No direct keyword overlaps.</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Title</span>
                    <strong style={{ fontSize: '0.95rem', color: match.similarities.title >= 50 ? 'var(--color-danger)' : 'var(--text-primary)' }}>{match.similarities.title}%</strong>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Abstract</span>
                    <strong style={{ fontSize: '0.95rem', color: match.similarities.abstract >= 50 ? 'var(--color-danger)' : 'var(--text-primary)' }}>{match.similarities.abstract}%</strong>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Description</span>
                    <strong style={{ fontSize: '0.95rem', color: match.similarities.description >= 50 ? 'var(--color-danger)' : 'var(--text-primary)' }}>{match.similarities.description}%</strong>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
