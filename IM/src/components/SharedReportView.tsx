import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SavedReport } from '../types';
import { ReportDisplay } from './ReportDisplay';
import { Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';

interface SharedReportViewProps {
  reportId: string;
  onBack: () => void;
}

export function SharedReportView({ reportId, onBack }: SharedReportViewProps) {
  const [report, setReport] = useState<SavedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const docRef = doc(db, 'reports', reportId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setReport({ id: docSnap.id, ...docSnap.data() } as SavedReport);
        } else {
          setError("Report not found or it is private.");
        }
      } catch (err: any) {
        console.error("Error fetching report:", err);
        setError("Could not load the report. It might be private or deleted.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-zinc-100 mb-3">Oops!</h2>
        <p className="text-zinc-400 mb-8 text-sm">{error}</p>
        <button
          onClick={onBack}
          className="inline-flex items-center px-4 py-2 bg-white hover:bg-zinc-200 text-black font-medium text-sm rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <button
        onClick={onBack}
        className="inline-flex items-center px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-sm rounded-lg border border-white/10 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to App
      </button>

      <div className="mb-12 bg-zinc-900/50 border border-white/10 rounded-2xl p-6 md:p-8">
        <div className="flex items-center space-x-4 mb-6">
          {report.authorPhoto ? (
            <img src={report.authorPhoto} alt={report.authorName} className="w-12 h-12 rounded-full border border-zinc-700" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
              <span className="text-zinc-300 font-medium text-lg">{report.authorName.charAt(0)}</span>
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Shared by {report.authorName}</h2>
            <p className="text-xs text-zinc-500 mt-1">Validated on {new Date(report.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="bg-zinc-950/50 rounded-xl p-5 border border-white/5">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">The Idea</h3>
          <p className="text-zinc-300 text-base leading-relaxed">{report.idea}</p>
        </div>
      </div>

      <ReportDisplay report={report} />
    </div>
  );
}
