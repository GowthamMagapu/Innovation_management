import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { SavedReport } from '../types';
import { Loader2, TrendingUp, Target, AlertTriangle, Skull, Activity, CheckCircle2 } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { cn } from '../lib/utils';

export function Dashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      if (!user) return;
      try {
        // Fetch all user reports
        const q = query(
          collection(db, 'reports'),
          where('authorId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SavedReport[];
        
        // Sort by createdAt locally to avoid needing a composite index immediately
        data.sort((a, b) => a.createdAt - b.createdAt);
        
        setReports(data);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-bold text-zinc-100 mb-4">Your Dashboard</h2>
        <p className="text-zinc-400">You haven't generated any reports yet. Validate an idea to see your stats!</p>
      </div>
    );
  }

  // Calculate KPIs
  const totalReports = reports.length;
  const averageScore = Math.round(reports.reduce((acc, r) => acc + r.validationScore.total, 0) / totalReports);
  const highestScore = Math.max(...reports.map(r => r.validationScore.total));
  
  const pursueCount = reports.filter(r => r.verdict.recommendation.toLowerCase() === 'pursue').length;
  const pivotCount = reports.filter(r => r.verdict.recommendation.toLowerCase() === 'pivot').length;
  const killCount = reports.filter(r => r.verdict.recommendation.toLowerCase() === 'kill').length;

  // Prepare data for line chart (Scores over time)
  const timelineData = reports.map((r, index) => ({
    name: `Idea ${index + 1}`,
    date: new Date(r.createdAt).toLocaleDateString(),
    score: r.validationScore.total,
    idea: r.idea.length > 30 ? r.idea.substring(0, 30) + '...' : r.idea
  }));

  // Prepare data for bar chart (Verdict distribution)
  const verdictData = [
    { name: 'Pursue', count: pursueCount, color: '#34d399' }, // emerald-400
    { name: 'Pivot', count: pivotCount, color: '#fbbf24' },  // amber-400
    { name: 'Kill', count: killCount, color: '#f87171' }     // red-400
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100 flex items-center">
          <Activity className="w-8 h-8 mr-3 text-blue-400" />
          Analytics Dashboard
        </h1>
        <p className="text-zinc-400 mt-2">Track your startup validation metrics and trends over time.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard 
          title="Total Ideas Validated" 
          value={totalReports} 
          icon={<Target className="w-5 h-5 text-blue-400" />} 
        />
        <KpiCard 
          title="Average Score" 
          value={averageScore} 
          suffix="/100"
          icon={<TrendingUp className="w-5 h-5 text-indigo-400" />} 
        />
        <KpiCard 
          title="Highest Score" 
          value={highestScore} 
          suffix="/100"
          icon={<TrendingUp className="w-5 h-5 text-emerald-400" />} 
        />
        <KpiCard 
          title="Pursue Rate" 
          value={Math.round((pursueCount / totalReports) * 100)} 
          suffix="%"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} 
        />
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart: Score Trend */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-zinc-100 mb-6">Validation Score Trend</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#a1a1aa" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#a1a1aa" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  domain={[0, 100]} 
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '0.5rem' }}
                  labelStyle={{ color: '#a1a1aa', marginBottom: '0.25rem' }}
                  formatter={(value: number) => [<span className="font-bold text-zinc-100">{value}</span>, 'Score']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return `${label} (${payload[0].payload.date})`;
                    }
                    return label;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#60a5fa" 
                  strokeWidth={3}
                  dot={{ fill: '#09090b', stroke: '#60a5fa', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#60a5fa' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Verdict Distribution */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-zinc-100 mb-6">Verdict Distribution</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={verdictData} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#a1a1aa" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#a1a1aa" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  allowDecimals={false}
                />
                <RechartsTooltip 
                  cursor={{ fill: '#27272a', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '0.5rem' }}
                  formatter={(value: number) => [<span className="font-bold text-zinc-100">{value}</span>, 'Count']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {verdictData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, suffix = '', icon }: { title: string, value: number | string, suffix?: string, icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
        <div className="p-2 rounded-lg bg-zinc-800/50 border border-white/5">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline">
        <span className="text-3xl font-bold text-zinc-100">{value}</span>
        {suffix && <span className="text-sm font-medium text-zinc-500 ml-1">{suffix}</span>}
      </div>
    </div>
  );
}
