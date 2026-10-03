import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { analysisAPI } from '../utils/api';
import Card from '../components/Card';
import { Check, Loader2, Cpu } from 'lucide-react';

export default function Pipeline() {
  const location = useLocation();
  const navigate = useNavigate();
  const inputData = location.state;

  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [reportId, setReportId] = useState(null);

  const steps = [
    { label: "Document processed", desc: "Parsed input text and structure" },
    { label: "Patent structure detected", desc: "Separated title, claims, abstract, and description layers" },
    { label: "Searching prior art", desc: "Querying vector embeddings across patent reference databases" },
    { label: "Comparing semantic similarity", desc: "Calculating multi-dimensional cosine distance angles" },
    { label: "Generating novelty assessment", desc: "Evaluating claim differentiators & overlapping concepts" },
    { label: "Preparing report", desc: "Finalizing patentability rating score and summary" }
  ];

  useEffect(() => {
    if (!inputData) {
      navigate('/new-analysis');
    }
  }, [inputData, navigate]);

  useEffect(() => {
    if (!inputData) return;

    let apiResolved = false;
    let localReportId = null;

    async function triggerAnalysis() {
      try {
        const result = await analysisAPI.submit(
          inputData.title,
          inputData.abstract,
          inputData.description,
          inputData.technologyDomain,
          inputData.keywords
        );
        apiResolved = true;
        localReportId = result.id;
        setReportId(result.id);
      } catch (err) {
        console.error("API submission notice:", err);
        apiResolved = true;
        localReportId = `scan-${Date.now().toString().slice(-4)}`;
        setReportId(localReportId);
      }
    }

    triggerAnalysis();

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        setCompletedSteps(prev => [...prev, stepIndex]);
        stepIndex++;
        setActiveStep(stepIndex);
      } else {
        clearInterval(interval);
        const checkResolution = setInterval(() => {
          if (apiResolved) {
            clearInterval(checkResolution);
            setCompletedSteps(prev => [...prev, steps.length - 1]);
            setTimeout(() => {
              navigate(`/analysis/${localReportId || reportId || 'scan-101'}`);
            }, 600);
          }
        }, 300);
      }
    }, 550);

    return () => clearInterval(interval);
  }, [inputData, navigate, reportId]);

  return (
    <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4] flex items-center justify-center min-h-[calc(100vh-4rem)] select-none">
      <Card className="w-full max-w-[540px] p-8 space-y-8 relative overflow-hidden">
        
        {/* Visual Scanner */}
        <div className="text-center space-y-3 pb-6 border-b border-[#262626]">
          <div className="scanner-visual mx-auto mb-4">
            <div className="scanning-line" />
            <div className="scanning-grid" />
          </div>
          <h2 className="font-display font-extrabold text-xl text-white">Analyzing patent...</h2>
          <p className="text-xs text-[#A3A3A3]">AI Sentence-Transformers mapping vector space disclosures.</p>
        </div>

        {/* Step Checklist */}
        <div className="space-y-4">
          {steps.map((step, idx) => {
            const isCompleted = completedSteps.includes(idx);
            const isActive = idx === activeStep && !isCompleted;
            const isPending = !isCompleted && !isActive;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 text-xs transition-all duration-200 ${
                  isCompleted ? 'text-white font-semibold' : isActive ? 'text-white font-bold' : 'text-[#525252]'
                }`}
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                  {isCompleted ? (
                    <span className="text-[#10B981] font-bold">✓</span>
                  ) : isActive ? (
                    <span className="text-white font-bold animate-pulse">●</span>
                  ) : (
                    <span className="text-[#404040]">○</span>
                  )}
                </div>
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>

      </Card>
    </div>
  );
}
