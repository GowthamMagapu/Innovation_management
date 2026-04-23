import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Validator } from './components/Validator';
import { MyReports } from './components/MyReports';
import { Dashboard } from './components/Dashboard';
import { SharedReportView } from './components/SharedReportView';
import { useAuth } from './AuthContext';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'validator' | 'dashboard' | 'my-reports'>('validator');
  const [sharedReportId, setSharedReportId] = useState<string | null>(null);
  const { loading } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportId = params.get('report');
    if (reportId) {
      setSharedReportId(reportId);
    }
  }, []);

  const handleClearSharedReport = () => {
    window.history.pushState({}, '', '/');
    setSharedReportId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50 font-sans selection:bg-white/20">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      
      <main>
        {sharedReportId ? (
          <SharedReportView reportId={sharedReportId} onBack={handleClearSharedReport} />
        ) : (
          <>
            {currentTab === 'validator' && <Validator />}
            {currentTab === 'dashboard' && <Dashboard />}
            {currentTab === 'my-reports' && <MyReports />}
          </>
        )}
      </main>
    </div>
  );
}
