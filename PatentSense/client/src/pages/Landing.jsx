import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import { Sparkles, Cpu, ArrowRight, ShieldCheck, Activity, HelpCircle } from 'lucide-react';

export default function Landing() {
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    { q: "How does the semantic search model differ from traditional databases?", a: "Traditional patent databases rely on exact keyword matches, which fails if similar designs use alternate vocabulary. PatentSense generates multi-dimensional mathematical vector embeddings of your abstract and description, mapping conceptual meanings regardless of words chosen." },
    { q: "Is my technical disclosure secure and private?", a: "Yes, 100%. PatentSense executes semantic calculations locally and stores your submission securely. Disclosures are never published or shared with external patent offices." },
    { q: "What references are contained in the checker's database?", a: "Our seed database is loaded with highly technical reference patents spanning AI model structures, green cell energy interfaces, medical optical spectroscopy devices, and soft robotic systems." }
  ];

  const features = [
    { title: "Vector Embeddings", text: "Vectorizes claims and technical paragraphs using Sentence-Transformers to map concepts exactly.", icon: Cpu },
    { title: "Cosine Similarity Index", text: "Separates title, abstract, and detailed description analysis to calculate weighted similarity percentages.", icon: Activity },
    { title: "Patentability Strategy", text: "Generates step-by-step drafting suggestions depending on similarity score thresholds.", icon: ShieldCheck }
  ];

  return (
    <div className="bg-[#000000] min-h-screen text-[#D4D4D4] font-sans select-none">
      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-black">
            <Sparkles className="w-5 h-5 fill-black text-black" />
          </div>
          <span className="font-display font-extrabold text-xl text-white tracking-tight">PATENTSENSE</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="md">Start Free Analysis</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#404040] bg-[#1A1A1A] text-[#D4D4D4] text-xs font-semibold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5 text-white" /> AI-Powered Patent Intelligence
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-white">
            AI Patent <br />
            <span className="text-[#A3A3A3]">Novelty Checker</span>
          </h1>
          <p className="text-[#A3A3A3] text-base sm:text-lg leading-relaxed max-w-lg">
            Discover novelty. Compare prior art. Make smarter patent decisions using Artificial Intelligence before filing a patent disclosure.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link to="/register">
              <Button variant="primary" size="lg" icon={ArrowRight}>
                Start Free Analysis
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </a>
          </div>
        </div>

        {/* Hero Visual Matrix */}
        <div className="relative flex justify-center">
          <Card className="w-full max-w-[420px] aspect-square p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-[#262626] pb-4">
              <span className="text-[11px] uppercase font-bold text-[#A3A3A3] tracking-widest">Semantic Vector Matrix</span>
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            </div>
            
            <div className="space-y-4 my-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-white" />
                <div className="flex-1 h-2 bg-[#262626] rounded overflow-hidden">
                  <div className="h-full bg-white rounded" style={{ width: '87%' }} />
                </div>
                <span className="text-xs text-white font-bold font-display">87% Novelty</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#666666]" />
                <div className="flex-1 h-2 bg-[#262626] rounded overflow-hidden">
                  <div className="h-full bg-[#666666] rounded" style={{ width: '13%' }} />
                </div>
                <span className="text-xs text-[#A3A3A3] font-semibold font-display">13% Match</span>
              </div>
            </div>

            <div className="border-t border-[#262626] pt-4 flex items-center justify-between">
              <span className="text-[#A3A3A3] text-xs">Vector Search Complete</span>
              <span className="text-xs text-white font-bold uppercase">HIGH NOVELTY</span>
            </div>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-[#262626]">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <h2 className="font-display text-3xl font-extrabold text-white">Re-engineered Patent Discovery</h2>
          <p className="text-[#A3A3A3] leading-relaxed text-sm">
            By shifting from syntactic keyword matches to semantic sentence transformer modeling, we provide accurate context checks.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <Card className="p-8 space-y-4 hover:border-[#404040] transition-all" key={i}>
                <div className="w-12 h-12 rounded-xl bg-[#262626] border border-[#404040] flex items-center justify-center text-white">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-white">{feat.title}</h3>
                <p className="text-[#A3A3A3] text-xs leading-relaxed">{feat.text}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-[#262626]">
        <h2 className="font-display text-3xl font-extrabold text-white text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div className="border border-[#262626] rounded-2xl bg-[#0A0A0A] overflow-hidden" key={i}>
              <button
                className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-[#1A1A1A] transition-all font-semibold"
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
              >
                <span className="text-white text-sm sm:text-base">{faq.q}</span>
                <HelpCircle className={`w-5 h-5 text-[#666666] transition-transform ${activeFaq === i ? 'rotate-180 text-white' : ''}`} />
              </button>
              {activeFaq === i && (
                <div className="px-6 pb-5 pt-1 text-[#A3A3A3] text-xs leading-relaxed border-t border-[#262626]">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#262626] bg-[#0A0A0A] py-12 text-[#666666] text-xs text-center">
        <div className="max-w-7xl mx-auto px-6 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="font-display font-extrabold text-sm text-white">PATENTSENSE</span>
          </div>
          <p>&copy; 2026 PatentSense AI. All rights reserved. Built for secure legal intelligence.</p>
        </div>
      </footer>
    </div>
  );
}
