import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Rocket, Lightbulb, AlertTriangle, Loader2, ChevronRight, Save, Globe, CheckCircle2, Link, Copy, Download
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { cn } from '../lib/utils';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ValidationReport } from '../types';
import { ReportDisplay } from './ReportDisplay';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    validationScore: {
      type: Type.OBJECT,
      properties: {
        total: { type: Type.NUMBER, description: "Score out of 100" },
        breakdown: {
          type: Type.OBJECT,
          properties: {
            marketDemand: { type: Type.NUMBER, description: "Score out of 20" },
            competition: { type: Type.NUMBER, description: "Score out of 20" },
            feasibility: { type: Type.NUMBER, description: "Score out of 20" },
            revenue: { type: Type.NUMBER, description: "Score out of 20" },
            innovation: { type: Type.NUMBER, description: "Score out of 20" }
          },
          required: ["marketDemand", "competition", "feasibility", "revenue", "innovation"]
        },
        reasoning: { type: Type.STRING }
      },
      required: ["total", "breakdown", "reasoning"]
    },
    marketDemand: { type: Type.STRING },
    competitiveLandscape: { type: Type.STRING },
    feasibility: { type: Type.STRING },
    revenuePotential: { type: Type.STRING },
    innovationAngle: { type: Type.STRING },
    swot: {
      type: Type.OBJECT,
      properties: {
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
        threats: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["strengths", "weaknesses", "opportunities", "threats"]
    },
    mvpSuggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          approach: { type: Type.STRING },
          description: { type: Type.STRING },
          hypothesis: { type: Type.STRING },
          successSignal: { type: Type.STRING }
        },
        required: ["approach", "description", "hypothesis", "successSignal"]
      }
    },
    verdict: {
      type: Type.OBJECT,
      properties: {
        recommendation: { type: Type.STRING, description: "Must be exactly 'Pursue', 'Pivot', or 'Kill'" },
        reasoning: { type: Type.STRING }
      },
      required: ["recommendation", "reasoning"]
    },
    relatedLinks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          url: { type: Type.STRING },
          type: { type: Type.STRING, description: "Must be 'article' or 'competitor'" }
        },
        required: ["title", "url", "type"]
      }
    }
  },
  required: [
    "validationScore",
    "marketDemand",
    "competitiveLandscape",
    "feasibility",
    "revenuePotential",
    "innovationAngle",
    "swot",
    "mvpSuggestions",
    "verdict",
    "relatedLinks"
  ]
};

const loadingMessages = [
  "Analyzing market demand...",
  "Evaluating competitive landscape...",
  "Assessing technical feasibility...",
  "Calculating revenue potential...",
  "Identifying innovation angles...",
  "Generating SWOT analysis...",
  "Formulating MVP strategies...",
  "Finalizing verdict..."
];

const FOCUS_OPTIONS = [
  { value: 'general', label: 'General / Standard Analysis' },
  { value: 'sustainability', label: 'Focus: Sustainability & Impact' },
  { value: 'scalability', label: 'Focus: Hyper-Scalability' },
  { value: 'bootstrapped', label: 'Focus: Bootstrapped / Low-Capital' },
  { value: 'enterprise', label: 'Focus: Enterprise B2B' }
];

export function Validator() {
  const { user } = useAuth();
  const [idea, setIdea] = useState('');
  const [focus, setFocus] = useState('general');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [savedDocId, setSavedDocId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [comparisons, setComparisons] = useState<Record<string, string>>({});
  const [comparingCompetitor, setComparingCompetitor] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleCopyLink = () => {
    if (!savedDocId) return;
    const url = `${window.location.origin}/?report=${savedDocId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCompareCompetitor = async (competitor: {title: string, url: string}) => {
    setComparingCompetitor(competitor.title);
    try {
      const prompt = `Compare the following startup idea with the competitor "${competitor.title}" (${competitor.url}). Highlight key differences in their value propositions and target markets. Keep it concise, under 150 words.\n\nStartup Idea: ${idea}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          temperature: 0.3
        }
      });
      if (response.text) {
        setComparisons(prev => ({ ...prev, [competitor.title]: response.text }));
      }
    } catch (err) {
      console.error("Comparison error:", err);
    } finally {
      setComparingCompetitor(null);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById('report-content');
      if (!element) return;
      const opt = {
        margin:       10,
        filename:     'startup-validation-report.pdf',
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#09090b' },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setLoadingIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleAnalyze = async () => {
    if (!idea.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setReport(null);
    setSaveSuccess(false);
    setSavedDocId(null);
    setLoadingIndex(0);

    const selectedFocusLabel = FOCUS_OPTIONS.find(f => f.value === focus)?.label || 'General';

    try {
      const prompt = `
You are an elite startup analyst and venture strategist. Your task is to validate a startup idea with the rigor of a top-tier VC analyst, but you MUST explain your findings in plain English so that a beginner founder can easily understand it. Avoid heavy business jargon, keep paragraphs short, and be direct.

I am submitting a startup idea for full validation. Analyze it across every critical dimension and deliver a comprehensive but EASY TO UNDERSTAND validation report.

**The idea to validate:**
${idea}

**Special Analysis Focus:** ${selectedFocusLabel}
Tailor your evaluation, SWOT, and MVP suggestions specifically through this lens. Be extremely critical and analytical. If the idea fails under this specific focus, explain exactly why in simple terms.

Your analysis must cover the following:

**1. Validation Score (out of 100)**
Give an overall viability score with a clear breakdown of how you weighted each factor. Be honest—a low score with sharp reasoning is more valuable than an inflated one.

**2. Market Demand**
Assess the size and urgency of the problem being solved. Is there demonstrated demand or is this a "nice to have"? Explain it simply.

**3. Competitive Landscape**
Identify key existing competitors and alternatives. Assess how crowded the space is and whether there is a defensible gap this idea could occupy.

**4. Feasibility**
Evaluate what it would realistically take to build and launch (technical complexity, resources, timeline). Flag any major execution risks clearly.

**5. Revenue Potential**
Identify the most viable monetization models for this idea. Estimate realistic revenue potential and note if this is a bootstrappable business or requires significant capital.

**6. Innovation Angle**
Assess what is genuinely new or differentiated about this idea. Does it create a new category or offer a meaningfully better version of something that exists?

**7. SWOT Analysis**
Deliver a sharp, specific SWOT. Each point should be a concise, actionable insight, not filler.

**8. MVP Suggestions**
Propose 2–3 concrete MVP approaches ranked by speed and cost to validate. For each, specify what hypothesis it tests and what a success signal looks like in simple terms.

**9. Verdict**
Close with a direct recommendation: Pursue, Pivot, or Kill—and exactly why, using clear and direct language.

**10. Related Links**
Use the Google Search tool to find 3-5 real, relevant articles or existing competitor applications related to this idea. Provide their titles and URLs.

Be direct, specific, and ruthlessly honest, but always explain *why* in a way anyone can understand.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.2,
        }
      });

      if (response.text) {
        let text = response.text;
        if (text.startsWith('\`\`\`json')) {
          text = text.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
        } else if (text.startsWith('\`\`\`')) {
          text = text.replace(/^\`\`\`\n/, '').replace(/\n\`\`\`$/, '');
        }
        
        try {
          const parsedReport = JSON.parse(text) as ValidationReport;
          setReport(parsedReport);
          
          // Auto-save the report if the user is logged in
          if (user) {
            try {
              const docRef = await addDoc(collection(db, 'reports'), {
                authorId: user.uid,
                authorName: user.displayName || 'Anonymous',
                authorPhoto: user.photoURL || '',
                idea,
                validationScore: parsedReport.validationScore,
                marketDemand: parsedReport.marketDemand,
                competitiveLandscape: parsedReport.competitiveLandscape,
                feasibility: parsedReport.feasibility,
                revenuePotential: parsedReport.revenuePotential,
                innovationAngle: parsedReport.innovationAngle,
                swot: parsedReport.swot,
                mvpSuggestions: parsedReport.mvpSuggestions,
                verdict: parsedReport.verdict,
                relatedLinks: parsedReport.relatedLinks || [],
                isPublic,
                createdAt: Date.now()
              });
              setSavedDocId(docRef.id);
              setSaveSuccess(true);
            } catch (saveErr) {
              console.error("Auto-save failed:", saveErr);
            }
          }
        } catch (parseErr: any) {
          console.error("JSON Parse Error:", parseErr, "Raw text:", text);
          throw new Error("Failed to parse the analysis report. Please try again.");
        }
      } else {
        throw new Error("Failed to generate report: No text returned.");
      }
    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError(err.message || JSON.stringify(err) || "An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!user || !report) return;
    setIsSaving(true);
    setError(null);
    try {
      if (savedDocId) {
        await updateDoc(doc(db, 'reports', savedDocId), {
          isPublic
        });
        setSaveSuccess(true);
      } else {
        const docRef = await addDoc(collection(db, 'reports'), {
          authorId: user.uid,
          authorName: user.displayName || 'Anonymous',
          authorPhoto: user.photoURL || '',
          idea,
          validationScore: report.validationScore,
          marketDemand: report.marketDemand,
          competitiveLandscape: report.competitiveLandscape,
          feasibility: report.feasibility,
          revenuePotential: report.revenuePotential,
          innovationAngle: report.innovationAngle,
          swot: report.swot,
          mvpSuggestions: report.mvpSuggestions,
          verdict: report.verdict,
          relatedLinks: report.relatedLinks || [],
          isPublic,
          createdAt: Date.now()
        });
        setSavedDocId(docRef.id);
        setSaveSuccess(true);
      }
    } catch (err: any) {
      console.error("Error saving report:", err);
      setError("Failed to save report: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8 relative">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="mb-16 text-center space-y-6 relative z-10">
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl mb-2 shadow-inner shadow-white/5 border border-white/10">
          <Rocket className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
          Startup Validator
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
          Submit your idea for a rigorous, VC-grade analysis. We evaluate market demand, feasibility, and revenue potential to provide actionable intelligence.
        </p>
      </header>

      {/* Input Section */}
      <motion.section 
        layout
        className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-2xl shadow-black/50"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <label htmlFor="idea" className="block text-base font-medium text-zinc-200">
              Describe your startup idea
            </label>
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              disabled={isAnalyzing}
              className="bg-zinc-950/50 border border-white/10 text-zinc-300 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block p-2.5 outline-none transition-all shadow-inner"
            >
              {FOCUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
            <textarea
              id="idea"
              rows={5}
              className="relative w-full bg-zinc-950/80 backdrop-blur-sm border border-white/10 rounded-2xl p-5 text-zinc-100 placeholder-zinc-600 font-sans text-lg focus:ring-0 focus:border-white/20 transition-all resize-y outline-none shadow-inner"
              placeholder="E.g., A B2B SaaS platform that uses AI to automatically generate and test different pricing models for e-commerce stores..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-sm text-zinc-400 flex items-center">
              <Lightbulb className="w-4 h-4 mr-2 text-amber-400" />
              Be as specific as possible about the problem, target audience, and solution.
            </p>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !idea.trim()}
              className="w-full sm:w-auto relative group overflow-hidden inline-flex items-center justify-center px-8 py-4 bg-white disabled:bg-zinc-800 text-black disabled:text-zinc-500 font-semibold text-base rounded-xl transition-all focus:outline-none shadow-xl shadow-white/10 hover:shadow-white/20 hover:-translate-y-0.5 disabled:shadow-none disabled:hover:translate-y-0"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Validate Idea
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Loading Overlay */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-zinc-950/80 backdrop-blur-xl flex flex-col items-center justify-center rounded-3xl"
            >
              <div className="relative w-20 h-20 mb-8">
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                <Rocket className="absolute inset-0 m-auto w-8 h-8 text-indigo-400 animate-pulse" />
              </div>
              <motion.p 
                key={loadingIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg font-medium text-zinc-200 text-center px-4 tracking-wide"
              >
                {loadingMessages[loadingIndex]}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {error && (
        <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-start">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Results Dashboard */}
      {report && (
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 space-y-8"
        >
          {/* Save Controls */}
          {user ? (
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isPublic} 
                    onChange={(e) => {
                      setIsPublic(e.target.checked);
                      setSaveSuccess(false);
                    }}
                    className="w-4 h-4 rounded border-white/20 bg-zinc-950 text-zinc-100 focus:ring-zinc-500 focus:ring-offset-zinc-900"
                  />
                  <span className="text-sm text-zinc-300 flex items-center">
                    <Globe className="w-4 h-4 mr-1.5 text-zinc-400" />
                    Make this report public
                  </span>
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                >
                  {isExporting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exporting...</>
                  ) : (
                    <><Download className="w-4 h-4 mr-2" /> Export PDF</>
                  )}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || saveSuccess}
                  className={cn(
                    "inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors",
                    saveSuccess 
                      ? "bg-zinc-800 text-zinc-300 border border-white/10" 
                      : "bg-white hover:bg-zinc-200 text-black"
                  )}
                >
                  {isSaving ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                  ) : saveSuccess ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Saved</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" /> {savedDocId ? "Update Visibility" : "Save Report"}</>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <p className="text-sm text-zinc-400">Sign in to save this report and share it with others.</p>
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
              >
                {isExporting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exporting...</>
                ) : (
                  <><Download className="w-4 h-4 mr-2" /> Export PDF</>
                )}
              </button>
            </div>
          )}

          {/* Shareable Link */}
          {savedDocId && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-3 w-full">
                <Link className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 mb-1">Shareable Link</p>
                  <p className="text-xs text-zinc-500 truncate">
                    {`${window.location.origin}/?report=${savedDocId}`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCopyLink}
                className="flex-shrink-0 inline-flex items-center px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg transition-colors"
              >
                {copied ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" /> Copied!</>
                ) : (
                  <><Copy className="w-4 h-4 mr-2" /> Copy Link</>
                )}
              </button>
            </motion.div>
          )}

          <div id="report-content" className="bg-[#09090b] p-4 rounded-xl">
            <ReportDisplay 
              report={report} 
              idea={idea} 
              onCompareCompetitor={handleCompareCompetitor} 
              comparingCompetitor={comparingCompetitor} 
              comparisons={comparisons} 
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
