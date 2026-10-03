import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import Toast from '../components/Toast';
import { Upload, FileText, X, Plus, Sparkles, Tag, CheckCircle2 } from 'lucide-react';

export default function NewAnalysis() {
  const [activeTab, setActiveTab] = useState('form'); // 'form' or 'upload'
  
  // Option B Form State
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [claims, setClaims] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('Artificial Intelligence');
  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');

  // Option A File State
  const [uploadedFile, setUploadedFile] = useState(null);
  
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const navigate = useNavigate();

  const domains = [
    "Artificial Intelligence",
    "Biotechnology & Healthcare",
    "Green Energy & CleanTech",
    "Internet of Things (IoT)",
    "Robotics & Automation",
    "Blockchain & Cyber Security",
    "Semiconductor & Quantum Computing"
  ];

  const handleAddKeyword = (e) => {
    e.preventDefault();
    if (!keywordInput.trim()) return;
    if (keywords.includes(keywordInput.trim())) {
      setKeywordInput('');
      return;
    }
    setKeywords([...keywords, keywordInput.trim()]);
    setKeywordInput('');
  };

  const handleRemoveKeyword = (index) => {
    setKeywords(keywords.filter((_, idx) => idx !== index));
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      setError("Supported file formats are PDF, DOCX, and TXT.");
      return;
    }
    setError('');
    setUploadedFile(file);
    setToastMsg(`Uploaded file: ${file.name}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (activeTab === 'upload') {
      if (!uploadedFile) {
        setError("Please upload a patent document (PDF, DOCX, TXT).");
        return;
      }
      // Pass file details to pipeline
      navigate('/pipeline', {
        state: {
          title: uploadedFile.name.replace(/\.[^/.]+$/, ""),
          abstract: `Extracted disclosures from uploaded file: ${uploadedFile.name}`,
          description: `Full document contents parsed from file of size ${(uploadedFile.size / 1024).toFixed(1)} KB.`,
          technologyDomain: "Uploaded Document Analysis",
          keywords: ["Document Upload", "Parsed PDF"]
        }
      });
      return;
    }

    // Option B Form Submission
    if (!title.trim()) {
      setError("Patent Title is required.");
      return;
    }
    if (!abstract.trim() && !description.trim()) {
      setError("Please provide an Abstract or Description for novelty evaluation.");
      return;
    }

    navigate('/pipeline', {
      state: {
        title,
        abstract: abstract || description.slice(0, 250),
        claims,
        description: description || abstract,
        technologyDomain: domain,
        keywords
      }
    });
  };

  return (
    <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4] overflow-y-auto max-w-4xl mx-auto w-full space-y-8 select-none">
      <Toast message={toastMsg} type="info" onClose={() => setToastMsg('')} />

      {/* Header */}
      <div className="border-b border-[#262626] pb-6">
        <h1 className="font-display font-extrabold text-3xl text-white tracking-tight">New Patent Analysis</h1>
        <p className="text-xs text-[#A3A3A3] mt-1">Upload or enter patent information to evaluate novelty and identify similar prior art.</p>
      </div>

      {error && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] p-4 rounded-xl text-xs font-semibold text-center">
          {error}
        </div>
      )}

      {/* Input Method Tabs */}
      <div className="flex border-b border-[#262626] space-x-8">
        <button
          type="button"
          onClick={() => setActiveTab('form')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'form' ? 'text-white border-b-2 border-white' : 'text-[#A3A3A3] hover:text-white'
          }`}
        >
          Option B — Enter Patent Information
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'upload' ? 'text-white border-b-2 border-white' : 'text-[#A3A3A3] hover:text-white'
          }`}
        >
          Option A — Upload Document
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'upload' ? (
          /* OPTION A — UPLOAD DOCUMENT */
          <Card className="space-y-6 p-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">
                Upload Patent Document (PDF, DOCX, TXT)
              </label>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="border-2 border-dashed border-[#404040] hover:border-white bg-[#0A0A0A] rounded-2xl p-12 text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[#404040] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>

                {uploadedFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-[#A3A3A3]">
                      {(uploadedFile.size / 1024).toFixed(1)} KB &bull; Click or drag to replace
                    </p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                      className="text-xs font-bold text-[#EF4444] hover:underline mt-2 inline-flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-white">Drag & drop your patent document here</p>
                    <p className="text-xs text-[#666666]">Supports PDF, DOCX, or TXT (Max 25MB)</p>
                    <div className="pt-2">
                      <label className="inline-block">
                        <input
                          type="file"
                          accept=".pdf,.docx,.txt"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <span className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs cursor-pointer hover:bg-[#E5E5E5] transition-all">
                          Browse Files
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ) : (
          /* OPTION B — ENTER PATENT INFORMATION */
          <Card className="space-y-6 p-8">
            <Input
              label="Patent Title"
              placeholder="e.g. AI-Based Autonomous Medical Imaging Diagnostic System"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">
                  Technology Domain
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#262626] bg-[#0A0A0A] text-white text-sm outline-none focus:border-white"
                >
                  {domains.map((cat, i) => (
                    <option value={cat} key={i}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">
                  Invention Keywords
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword(e)}
                    placeholder="Add keyword & press Enter"
                    className="flex-1 px-4 py-3 rounded-xl border border-[#262626] bg-[#0A0A0A] text-white text-sm outline-none focus:border-white"
                  />
                  <Button type="button" variant="secondary" size="md" onClick={handleAddKeyword}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {keywords.map((word, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#262626] border border-[#404040] text-xs font-semibold text-white">
                    <Tag className="w-3 h-3 text-[#A3A3A3]" />
                    {word}
                    <button type="button" onClick={() => handleRemoveKeyword(idx)} className="text-[#A3A3A3] hover:text-white ml-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <Input
              label="Abstract"
              type="textarea"
              rows={3}
              placeholder="Provide a concise 150-250 word summary of the technical invention..."
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
            />

            <Input
              label="Claims"
              type="textarea"
              rows={3}
              placeholder="Specify primary independent claims (e.g., Claim 1: A system comprising a neural network controller configured to...)"
              value={claims}
              onChange={(e) => setClaims(e.target.value)}
            />

            <Input
              label="Detailed Description"
              type="textarea"
              rows={5}
              placeholder="Outline structural layers, algorithmic processes, signal frequencies, sensor configurations, or mechanical operations in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Card>
        )}

        {/* Primary CTA */}
        <div className="pt-2">
          <Button type="submit" variant="primary" size="lg" icon={Sparkles} className="w-full">
            Run AI Analysis
          </Button>
        </div>
      </form>
    </div>
  );
}
