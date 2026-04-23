import React, { useState } from 'react';
import { Target, Swords, Wrench, DollarSign, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Zap, ShieldAlert, Skull, Link as LinkIcon, FileText, Box, ThumbsUp, ThumbsDown, GitCompare, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { ValidationReport } from '../types';

interface ReportDisplayProps {
  report: ValidationReport;
  controls?: React.ReactNode;
  idea?: string;
  onCompareCompetitor?: (competitor: {title: string, url: string}) => void;
  comparingCompetitor?: string | null;
  comparisons?: Record<string, string>;
}

export function ReportDisplay({ report, controls, idea, onCompareCompetitor, comparingCompetitor, comparisons }: ReportDisplayProps) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const verdictMap: Record<string, any> = {
    Pursue: { text: "Pursue", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: <CheckCircle2 className="w-8 h-8 text-emerald-400 mr-3" /> },
    Pivot: { text: "Pivot", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: <AlertTriangle className="w-8 h-8 text-amber-400 mr-3" /> },
    Kill: { text: "Kill", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: <Skull className="w-8 h-8 text-red-400 mr-3" /> }
  };

  // Normalize the recommendation to match the map keys
  let rec = report.verdict.recommendation;
  if (rec.toLowerCase() === 'pursue') rec = 'Pursue';
  else if (rec.toLowerCase() === 'pivot') rec = 'Pivot';
  else if (rec.toLowerCase() === 'kill') rec = 'Kill';
  else rec = 'Pivot'; // Fallback

  const v = verdictMap[rec];

  return (
    <div className="space-y-6">
      {controls && (
        <div className="mb-6">
          {controls}
        </div>
      )}

      {/* Top Bar: Score & Verdict */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score Card */}
        <div className="col-span-1 bg-zinc-900/50 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">Validation Score</h3>
          <div className="flex items-baseline justify-center">
            <span className={cn(
              "text-6xl font-bold tracking-tight",
              report.validationScore.total >= 80 ? "text-emerald-400" :
              report.validationScore.total >= 60 ? "text-amber-400" : "text-red-400"
            )}>
              {report.validationScore.total}
            </span>
            <span className="text-2xl font-medium text-zinc-600 ml-1">/100</span>
          </div>
        </div>

        {/* Verdict Card */}
        <div className={cn(
          "col-span-1 md:col-span-2 border rounded-2xl p-6 flex flex-col justify-center",
          v.bg, v.border
        )}>
          <div className="flex items-center mb-4">
            {v.icon}
            <h2 className={cn("text-3xl font-bold tracking-tight", v.color)}>
              {v.text}
            </h2>
          </div>
          <p className="text-zinc-300 leading-relaxed text-base">
            {report.verdict.reasoning}
          </p>
        </div>
      </div>

      {/* Score Breakdown & Reasoning */}
      <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 md:p-8">
        <h3 className="text-xl font-semibold text-zinc-100 mb-6 flex items-center">
          <Target className="w-6 h-6 mr-3 text-blue-400" />
          Score Breakdown
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <ScoreItem label="Market" score={report.validationScore.breakdown.marketDemand} max={20} color="bg-blue-400" />
          <ScoreItem label="Competition" score={report.validationScore.breakdown.competition} max={20} color="bg-indigo-400" />
          <ScoreItem label="Feasibility" score={report.validationScore.breakdown.feasibility} max={20} color="bg-amber-400" />
          <ScoreItem label="Revenue" score={report.validationScore.breakdown.revenue} max={20} color="bg-emerald-400" />
          <ScoreItem label="Innovation" score={report.validationScore.breakdown.innovation} max={20} color="bg-purple-400" />
        </div>
        <div className="bg-zinc-950/50 rounded-xl p-5 border border-white/5">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Analyst Notes</h4>
          <p className="text-zinc-300 leading-relaxed text-sm">{report.validationScore.reasoning}</p>
        </div>
      </div>

      {/* Detailed Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnalysisCard 
          title="Market Demand" 
          icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
          content={report.marketDemand}
        />
        <AnalysisCard 
          title="Competitive Landscape" 
          icon={<Swords className="w-5 h-5 text-indigo-400" />}
          content={report.competitiveLandscape}
        />
        <AnalysisCard 
          title="Feasibility" 
          icon={<Wrench className="w-5 h-5 text-amber-400" />}
          content={report.feasibility}
        />
        <AnalysisCard 
          title="Revenue Potential" 
          icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
          content={report.revenuePotential}
        />
        <AnalysisCard 
          title="Innovation Angle" 
          icon={<Zap className="w-5 h-5 text-purple-400" />}
          content={report.innovationAngle}
          className="md:col-span-2"
        />
      </div>

      {/* SWOT Analysis Quadrant */}
      <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 md:p-8">
        <h3 className="text-xl font-semibold text-zinc-100 mb-6 flex items-center">
          <ShieldAlert className="w-6 h-6 mr-3 text-zinc-400" />
          SWOT Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 rounded-xl overflow-hidden border border-white/10">
          <div className="p-6 border-b md:border-r border-white/10 bg-emerald-500/5">
            <h4 className="text-emerald-400 font-bold uppercase tracking-wider mb-4 flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
              Strengths
            </h4>
            <ul className="space-y-3">
              {report.swot.strengths.map((item, idx) => (
                <li key={idx} className="text-zinc-300 text-sm leading-relaxed flex items-start">
                  <span className="mr-2 text-emerald-500/50">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 border-b border-white/10 bg-red-500/5">
            <h4 className="text-red-400 font-bold uppercase tracking-wider mb-4 flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-400 mr-2"></span>
              Weaknesses
            </h4>
            <ul className="space-y-3">
              {report.swot.weaknesses.map((item, idx) => (
                <li key={idx} className="text-zinc-300 text-sm leading-relaxed flex items-start">
                  <span className="mr-2 text-red-500/50">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 md:border-r border-white/10 bg-blue-500/5">
            <h4 className="text-blue-400 font-bold uppercase tracking-wider mb-4 flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-400 mr-2"></span>
              Opportunities
            </h4>
            <ul className="space-y-3">
              {report.swot.opportunities.map((item, idx) => (
                <li key={idx} className="text-zinc-300 text-sm leading-relaxed flex items-start">
                  <span className="mr-2 text-blue-500/50">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 bg-amber-500/5">
            <h4 className="text-amber-400 font-bold uppercase tracking-wider mb-4 flex items-center">
              <span className="w-2 h-2 rounded-full bg-amber-400 mr-2"></span>
              Threats
            </h4>
            <ul className="space-y-3">
              {report.swot.threats.map((item, idx) => (
                <li key={idx} className="text-zinc-300 text-sm leading-relaxed flex items-start">
                  <span className="mr-2 text-amber-500/50">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* MVP Suggestions */}
      <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 md:p-8">
        <h3 className="text-xl font-semibold text-zinc-100 mb-6 flex items-center">
          <Zap className="w-6 h-6 mr-3 text-amber-400" />
          MVP Validation Strategies
        </h3>
        <div className="space-y-4">
          {report.mvpSuggestions.map((mvp, idx) => (
            <div key={idx} className="bg-zinc-950/50 border border-white/5 rounded-xl p-6">
              <div className="flex items-start mb-3">
                <span className="flex items-center justify-center w-6 h-6 rounded bg-zinc-800 text-zinc-300 text-sm font-medium mr-3 mt-0.5">
                  {idx + 1}
                </span>
                <h4 className="text-lg font-semibold text-zinc-100">
                  {mvp.approach}
                </h4>
              </div>
              <p className="text-zinc-400 mb-5 text-sm pl-9">{mvp.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-9">
                <div className="bg-zinc-900/80 rounded-lg p-4 border border-white/5">
                  <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Hypothesis to Test</span>
                  <p className="text-sm text-zinc-300">{mvp.hypothesis}</p>
                </div>
                <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/10">
                  <span className="block text-xs font-semibold text-emerald-500/80 uppercase tracking-wider mb-1.5">Success Signal</span>
                  <p className="text-sm text-emerald-400/90">{mvp.successSignal}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Related Links */}
      {report.relatedLinks && report.relatedLinks.length > 0 && (
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 md:p-8">
          <h3 className="text-xl font-semibold text-zinc-100 mb-6 flex items-center">
            <LinkIcon className="w-6 h-6 mr-3 text-blue-400" />
            Related Articles & Competitors
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.relatedLinks.map((link, idx) => (
              <div 
                key={idx} 
                className="flex flex-col p-4 bg-zinc-950/50 border border-white/5 rounded-xl transition-colors"
              >
                <a href={link.url} target="_blank" rel="noreferrer" className="group block">
                  <div className="flex items-center mb-2">
                    {link.type === 'competitor' ? (
                      <Box className="w-4 h-4 mr-2 text-amber-400 flex-shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2 text-blue-400 flex-shrink-0" />
                    )}
                    <span className="text-zinc-200 font-medium group-hover:text-blue-400 transition-colors line-clamp-1">{link.title}</span>
                  </div>
                  <span className="text-zinc-500 text-xs truncate pl-6 block hover:text-zinc-400">{link.url}</span>
                </a>

                {link.type === 'competitor' && onCompareCompetitor && (
                  <div className="mt-3 pt-3 border-t border-white/5 pl-6">
                    {!comparisons?.[link.title] && comparingCompetitor !== link.title && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          onCompareCompetitor(link);
                        }}
                        className="inline-flex items-center text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        <GitCompare className="w-3 h-3 mr-1.5" />
                        Compare with my idea
                      </button>
                    )}
                    {comparingCompetitor === link.title && (
                      <div className="flex items-center text-xs text-zinc-400">
                        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                        Analyzing differences...
                      </div>
                    )}
                    {comparisons?.[link.title] && (
                      <div className="text-sm text-zinc-300 bg-black/20 rounded-lg p-3 border border-white/5 mt-2">
                        <div className="flex items-center mb-2">
                          <GitCompare className="w-4 h-4 mr-2 text-amber-400" />
                          <span className="font-semibold text-zinc-200">Comparison</span>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed text-xs">
                          <ReactMarkdown>{comparisons[link.title]}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Mechanism */}
      <div className="mt-12 flex flex-col items-center justify-center border-t border-white/10 pt-8 pb-4">
        <p className="text-zinc-400 mb-4 font-medium">How helpful was this analysis?</p>
        <div className="flex space-x-4">
          <button 
            onClick={() => setFeedback('up')} 
            className={cn(
              "p-4 rounded-full border transition-all duration-200", 
              feedback === 'up' 
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 scale-110" 
                : "border-white/10 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            )}
          >
            <ThumbsUp className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setFeedback('down')} 
            className={cn(
              "p-4 rounded-full border transition-all duration-200", 
              feedback === 'down' 
                ? "bg-red-500/20 border-red-500/50 text-red-400 scale-110" 
                : "border-white/10 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            )}
          >
            <ThumbsDown className="w-6 h-6" />
          </button>
        </div>
        {feedback && (
          <p className="text-emerald-400 text-sm mt-4 animate-in fade-in slide-in-from-bottom-2">
            Thank you for your feedback!
          </p>
        )}
      </div>
    </div>
  );
}

export function ScoreItem({ label, score, max, color }: { label: string, score: number, max: number, color: string }) {
  const percentage = (score / max) * 100;
  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-end mb-1.5">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-center space-x-1 mb-2">
        <span className="text-xl font-bold text-zinc-100">{score}</span>
        <span className="text-xs font-medium text-zinc-600">/{max}</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function AnalysisCard({ title, icon, content, className }: { title: string, icon: React.ReactNode, content: string, className?: string }) {
  return (
    <div className={cn("bg-zinc-900/50 border border-white/10 rounded-2xl p-6 flex flex-col", className)}>
      <div className="flex items-center mb-4">
        <div className="p-2 rounded-lg bg-zinc-800/50 border border-white/5 mr-3">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-zinc-100">
          {title}
        </h3>
      </div>
      <div className="prose prose-invert prose-zinc max-w-none prose-p:leading-relaxed prose-p:text-sm prose-a:text-blue-400 font-normal">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
