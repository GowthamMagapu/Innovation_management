import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { SavedReport } from '../types';
import { Loader2, Library, Globe, Lock, Share2, CheckCircle2, Skull, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { ScoreRadarChart } from './ScoreRadarChart';

export function MyReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchReports = async () => {
      try {
        const q = query(
          collection(db, 'reports'),
          where('authorId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetchedReports: SavedReport[] = [];
        querySnapshot.forEach((doc) => {
          fetchedReports.push({ id: doc.id, ...doc.data() } as SavedReport);
        });
        
        fetchedReports.sort((a, b) => b.createdAt - a.createdAt);
        setReports(fetchedReports);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  const handleShare = (id: string) => {
    const url = `${window.location.origin}/?report=${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-12 flex items-center space-x-4">
        <div className="p-3 bg-zinc-900 rounded-xl border border-white/10">
          <Library className="w-6 h-6 text-zinc-100" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">My Reports</h1>
          <p className="text-zinc-400 mt-1 text-sm">Your personal collection of validated ideas.</p>
        </div>
      </header>

      {reports.length === 0 ? (
        <div className="text-center py-24 bg-zinc-900/50 border border-white/10 rounded-2xl">
          <Library className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-zinc-100 mb-2">No reports yet</h3>
          <p className="text-zinc-400 text-sm">Go to the Validator to analyze your first idea.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => {
            const rec = report.verdict.recommendation.toLowerCase();
            const isPursue = rec === 'pursue';
            const isPivot = rec === 'pivot';
            const vColor = isPursue ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : isPivot ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20';
            const vText = isPursue ? 'Pursue' : isPivot ? 'Pivot' : 'Kill';

            return (
              <div key={report.id} className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 flex flex-col relative group hover:border-white/20 transition-all">
                <div className="absolute top-4 right-4 z-10">
                  <button 
                    onClick={() => handleShare(report.id)}
                    className="bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 p-2 rounded-lg flex items-center border border-white/10 transition-colors backdrop-blur-sm"
                    title="Copy share link"
                  >
                    {copiedId === report.id ? (
                      <><CheckCircle2 className="w-4 h-4 text-emerald-400 mr-1.5" /><span className="text-xs font-medium text-emerald-400">Copied</span></>
                    ) : (
                      <><Share2 className="w-4 h-4 mr-1.5" /><span className="text-xs font-medium">Share</span></>
                    )}
                  </button>
                </div>

                <div className="flex justify-between items-start mb-4">
                  <div className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border flex items-center",
                    vColor
                  )}>
                    {isPursue && <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
                    {isPivot && <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />}
                    {!isPursue && !isPivot && <Skull className="w-3.5 h-3.5 mr-1.5" />}
                    {vText}
                  </div>
                </div>
                
                <h3 className="text-base font-medium text-zinc-100 mb-6 line-clamp-3 leading-relaxed">
                  {report.idea}
                </h3>

                <div className="mb-6 bg-zinc-950/50 rounded-xl p-4 border border-white/5">
                  <ScoreRadarChart breakdown={report.validationScore.breakdown} height={180} color={isPursue ? '#34d399' : isPivot ? '#fbbf24' : '#f87171'} />
                </div>
                
                <div className="mt-auto pt-5 flex items-center justify-between border-t border-white/10">
                  <div className="flex items-baseline">
                    <span className={cn("text-3xl font-bold tracking-tight mr-1", isPursue ? 'text-emerald-400' : isPivot ? 'text-amber-400' : 'text-red-400')}>{report.validationScore.total}</span>
                    <span className="text-xs font-medium text-zinc-500">/100</span>
                  </div>
                  <div className="flex flex-col items-end space-y-1.5">
                    <div className="flex items-center text-[10px] font-semibold uppercase tracking-wider text-zinc-400 bg-zinc-950 px-2 py-1 rounded border border-white/5">
                      {report.isPublic ? (
                        <><Globe className="w-3 h-3 mr-1 text-blue-400" /> Public</>
                      ) : (
                        <><Lock className="w-3 h-3 mr-1 text-zinc-500" /> Private</>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-zinc-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <button 
                    onClick={() => window.location.href = `/?report=${report.id}`}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-zinc-100 font-medium text-sm rounded-lg border border-white/10 transition-colors"
                  >
                    View Report
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
