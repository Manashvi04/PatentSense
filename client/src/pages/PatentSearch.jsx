import React, { useEffect, useState } from 'react';
import { analysisAPI } from '../utils/api';
import { Search, Filter, BookOpen, User, Calendar, Tag } from 'lucide-react';

export default function PatentSearch() {
  const [patents, setPatents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const categories = [
    "Artificial Intelligence",
    "Biotechnology & Healthcare",
    "Green Energy & CleanTech",
    "Internet of Things (IoT)",
    "Robotics & Automation"
  ];

  useEffect(() => {
    async function loadPatents() {
      setLoading(true);
      setError('');
      try {
        const data = await analysisAPI.getPatents(searchTerm, category);
        setPatents(data);
      } catch (err) {
        setError('Failed to query patent records.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    const delayDebounce = setTimeout(() => {
      loadPatents();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, category]);

  return (
    <div className="main-content animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-title" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Reference Patents Database</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Explore and query the legal prior art index parsed by the PatentSense NLP models.</p>
      </div>

      {/* Filters bar */}
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1.25rem', padding: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.75rem' }}
            placeholder="Search by Title, Abstract, or Patent Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ minWidth: '220px', position: 'relative' }}>
          <Filter size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <select
            className="form-control"
            style={{ paddingLeft: '2.75rem' }}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Tech Categories</option>
            {categories.map((cat, i) => (
              <option value={cat} key={i}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="badge badge-low" style={{ display: 'block', padding: '1rem', marginBottom: '2rem', borderRadius: '8px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '30vh', flexDirection: 'column', gap: '1rem' }}>
          <div className="scanning-visual" style={{ width: '60px', height: '60px', margin: 0 }}>
            <div className="scanning-line" />
            <div className="scanning-grid" />
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Searching prior art index...</p>
        </div>
      ) : patents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}>
          No reference patents match your search parameters.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {patents.map((patent) => (
            <div className="card patent-result-card" key={patent.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{patent.title}</h3>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <BookOpen size={14} style={{ color: 'var(--accent-secondary)' }} />
                      No: <strong>{patent.patent_number}</strong>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Tag size={14} style={{ color: 'var(--accent-primary)' }} />
                      {patent.category}
                    </span>
                  </div>
                </div>
                <span className="badge badge-info" style={{ textTransform: 'none' }}>
                  {patent.assignee}
                </span>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                {patent.abstract}
              </p>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '0.75rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <User size={12} />
                  Inventors: <strong style={{ color: 'var(--text-secondary)' }}>{patent.inventors}</strong>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar size={12} />
                  Filing Date: <strong style={{ color: 'var(--text-secondary)' }}>{patent.filing_date}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
