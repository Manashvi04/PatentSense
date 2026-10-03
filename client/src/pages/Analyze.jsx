import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { analysisAPI } from '../utils/api';
import { Activity, ArrowRight, ArrowLeft, Search } from 'lucide-react';

export default function Analyze() {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [description, setDescription] = useState('');
  const [scanning, setScanning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const logContainerRef = useRef(null);

  const logsData = [
    { delay: 300, msg: "Initializing connection to SQLite database index..." },
    { delay: 700, msg: "Processing technical text and stripping English stopwords..." },
    { delay: 1100, msg: "Extracting core technical parameters and TF-IDF terms..." },
    { delay: 1600, msg: "Loading reference corpus of preseeded patent publications..." },
    { delay: 2100, msg: "Running cosine similarity evaluation across all documents..." },
    { delay: 2500, msg: "Locating highest semantic overlaps & mapping overlap matrices..." },
    { delay: 2900, msg: "Synthesizing AI evaluation critique and strategy guidelines..." },
    { delay: 3300, msg: "Finalizing reports package and saving results..." }
  ];

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const runScanLogs = (reportId) => {
    setLogs([]);
    let idx = 0;

    const printLog = () => {
      if (idx < logsData.length) {
        const logItem = logsData[idx];
        const timeStr = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { time: timeStr, text: logItem.msg }]);
        idx++;
        setTimeout(printLog, logItem.delay - (idx > 1 ? logsData[idx - 2].delay : 0));
      } else {
        setTimeout(() => {
          navigate(`/report/${reportId}`);
        }, 600);
      }
    };

    printLog();
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !abstract.trim() || !description.trim()) {
      setError("Title, abstract, and detailed description are required fields.");
      return;
    }

    setError('');
    setScanning(true);

    try {
      const data = await analysisAPI.submit(title, abstract, description);
      runScanLogs(data.id);
    } catch (err) {
      setError(err.message || "An unexpected error occurred during similarity calculation.");
      setScanning(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !title.trim()) return;
    if (step === 2 && !abstract.trim()) return;
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  if (scanning) {
    return (
      <div className="main-content">
        <div className="card scanner-overlay" style={{ maxWidth: '650px', margin: '3rem auto' }}>
          <div className="scanning-visual">
            <div className="scanning-line" />
            <div className="scanning-grid" />
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }} className="brand-gradient">AI Patent Scan in Progress</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
            Generating TF-IDF semantic embeddings and scanning legal database...
          </p>

          <div className="scanner-steps-log" ref={logContainerRef}>
            {logs.map((log, i) => (
              <div className="scanner-log-line" key={i}>
                <span className="scanner-log-time">[{log.time}]</span>
                <span>{log.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content animate-fade-in" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 className="gradient-title" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Novelty & Similarity Analyzer</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Identify matching patents, assess legal risks, and get structural recommendations.</p>
      </div>

      {error && (
        <div className="badge badge-low" style={{ display: 'block', padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* Steps progress indicator */}
      <div className="step-container">
        <div className={`step-indicator ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>1</div>
        <div className={`step-indicator ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>2</div>
        <div className={`step-indicator ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>3</div>
      </div>

      <div className="card">
        {step === 1 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Step 1: Invention Title</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Enter a concise title stating the primary technical core of your design.</p>
            <div className="form-group">
              <label className="form-label">Invention Title</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Non-invasive optical monitoring of cardiac arterial blood pressure"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button className="btn btn-primary" onClick={nextStep} disabled={!title.trim()}>
                Next Step
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Step 2: Technical Abstract</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Summarize the system configuration, mechanical/digital process, and utility benefits.</p>
            <div className="form-group">
              <label className="form-label">Abstract</label>
              <textarea
                className="form-control"
                placeholder="Describe your design structure. Be technical; detail specific sensor systems, cloud layers, mechanical elements, or algorithms..."
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <button className="btn btn-secondary" onClick={prevStep}>
                <ArrowLeft size={16} />
                Back
              </button>
              <button className="btn btn-primary" onClick={nextStep} disabled={!abstract.trim()}>
                Next Step
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Step 3: Detailed Description</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Explain the precise step-by-step algorithms, structural dependencies, or signal flows.</p>
            <form onSubmit={handleScanSubmit}>
              <div className="form-group">
                <label className="form-label">Detailed Description</label>
                <textarea
                  className="form-control"
                  style={{ minHeight: '200px' }}
                  placeholder="Detail the operational loops. What happens first? How is noise filtered? How do hardware and software modules interact? Explain in depth to ensure accurate vector matching."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                <button className="btn btn-secondary" onClick={prevStep}>
                  <ArrowLeft size={16} />
                  Back
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--gold-gradient)', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)' }} disabled={!description.trim()}>
                  <Search size={16} />
                  Run Semantic Scan
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
