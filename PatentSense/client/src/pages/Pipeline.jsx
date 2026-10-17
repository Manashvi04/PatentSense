import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { analysisAPI } from '../utils/api';
import Card from '../components/Card';
import Button from '../components/Button';

const STEPS = [
  'Document processed',
  'Patent structure detected',
  'Searching prior art',
  'Comparing semantic similarity',
  'Generating novelty screening guidance',
  'Preparing report',
];

export default function Pipeline() {
  const location = useLocation();
  const navigate = useNavigate();
  const inputData = location.state;
  const requestRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!inputData) {
      navigate('/new-analysis', { replace: true });
      return undefined;
    }

    let cancelled = false;
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < STEPS.length - 1) {
        setCompletedSteps((previous) => previous.includes(stepIndex) ? previous : [...previous, stepIndex]);
        stepIndex += 1;
        setActiveStep(stepIndex);
      }
    }, 450);

    if (!requestRef.current) {
      requestRef.current = analysisAPI.submit(
        inputData.title,
        inputData.abstract,
        inputData.description,
        inputData.technologyDomain,
        inputData.keywords,
        inputData.claims,
        inputData.sourceDocument,
      );
    }

    requestRef.current
      .then((result) => {
        if (cancelled) return;
        clearInterval(interval);
        setCompletedSteps(STEPS.map((_, index) => index));
        setTimeout(() => {
          if (!cancelled) navigate(`/analysis/${result.id}`, { replace: true });
        }, 400);
      })
      .catch((requestError) => {
        if (cancelled) return;
        clearInterval(interval);
        setError(requestError);
      });

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [inputData, navigate]);

  if (error) {
    const noMatch = error.code === 'NO_SUITABLE_MATCH';
    const unavailable = error.code === 'AI_SERVICE_UNAVAILABLE';
    return (
      <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4] flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-[540px] p-8 space-y-5">
          <h2 className="font-display font-extrabold text-xl text-white">
            {noMatch ? 'No suitable reference found' : unavailable ? 'Similarity service unavailable' : 'Analysis could not be completed'}
          </h2>
          <p className="text-sm text-[#A3A3A3] leading-relaxed">{error.message}</p>
          <p className="text-xs text-[#666666]">No novelty score or report was saved for this request.</p>
          <Button variant="primary" onClick={() => navigate('/new-analysis', { replace: true })}>Return to analysis form</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-[#000000] text-[#D4D4D4] flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-[540px] p-8 space-y-8 relative overflow-hidden">
        <div className="text-center space-y-3 pb-6 border-b border-[#262626]">
          <div className="scanner-visual mx-auto mb-4"><div className="scanning-line" /><div className="scanning-grid" /></div>
          <h2 className="font-display font-extrabold text-xl text-white">Analyzing patent...</h2>
          <p className="text-xs text-[#A3A3A3]">Retrieving and ranking references from the patent library.</p>
        </div>
        <div className="space-y-4">
          {STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            const isActive = index === activeStep && !isCompleted;
            return (
              <div key={step} className={`flex items-center gap-3 text-xs ${isCompleted || isActive ? 'text-white font-semibold' : 'text-[#525252]'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center ${isCompleted ? 'text-[#10B981]' : isActive ? 'animate-pulse' : 'text-[#404040]'}`}>
                  {isCompleted ? '✓' : isActive ? '●' : '○'}
                </span>
                <span>{step}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
