import React from 'react'
import { 
  Users, 
  Activity, 
  Calendar, 
  ShieldCheck, 
  TrendingUp, 
  BrainCircuit, 
  ChevronRight, 
  Clock, 
  AlertTriangle 
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts'

export default function DashboardView({ metrics, loading, onNavigateTo }) {
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 rounded-2xl bg-slate-900 border border-slate-800" />
          ))}
        </div>
        <div className="h-80 rounded-2xl bg-slate-900 border border-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-slate-900 border border-slate-800" />
          <div className="h-64 rounded-2xl bg-slate-900 border border-slate-800" />
        </div>
      </div>
    )
  }

  // Pre-process specialty data for Recharts
  const specialtyData = Object.entries(metrics.specialty_distribution || {}).map(([name, value]) => ({
    name,
    count: value
  }))

  const BAR_COLORS = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Total Interactions */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden transition-all hover:scale-[1.01] hover:border-indigo-500/30">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detailing Visits</p>
              <h3 className="text-3xl font-bold text-white mt-2">{metrics.total_interactions}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-indigo-400">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Interactive logs actively recorded</span>
          </div>
        </div>

        {/* Registered HCPs */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden transition-all hover:scale-[1.01] hover:border-indigo-500/30">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target HCPs</p>
              <h3 className="text-3xl font-bold text-white mt-2">{metrics.total_hcps}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">
            Across endocrinology, cardiology & oncology
          </div>
        </div>

        {/* Open Followups */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden transition-all hover:scale-[1.01] hover:border-indigo-500/30">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Tasks</p>
              <h3 className="text-3xl font-bold text-white mt-2">{metrics.pending_followups}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">
            Clinical items awaiting MSL scheduling
          </div>
        </div>

        {/* Compliance Rating */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden transition-all hover:scale-[1.01] hover:border-indigo-500/30">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Audit Rating</p>
              <h3 className="text-3xl font-bold text-white mt-2">{metrics.compliance_score}%</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-emerald-400">
            <span>PhRMA code check fully secure</span>
          </div>
        </div>

      </div>

      {/* 2. AI CRM Detailing Suggestions */}
      <div className="glass-panel-accent rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="h-5 w-5 text-indigo-400" />
          <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">
            AI-First Strategic Detailing Insights
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.ai_insights?.map((insight, idx) => (
            <div 
              key={idx} 
              className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/10 text-xs text-slate-300 font-medium"
              dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
            />
          ))}
        </div>
      </div>

      {/* 3. Graphs Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Detailing Engagement Trend Graph */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">Detailing Visit Frequency Trends</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.engagement_trends}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111B35', border: '1px solid #1E293B', borderRadius: '12px', color: '#FFF' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Specialty distribution chart */}
        <div className="glass-panel rounded-2xl p-6">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">Target Specialty Share</h4>
          <div className="h-64">
            {specialtyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={specialtyData}>
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111B35', border: '1px solid #1E293B', borderRadius: '12px', color: '#FFF' }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={30}>
                    {specialtyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No specialty data cached
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. Action Boards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Upcoming follow-up list */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Critical Detailing Tasks</h4>
            <button 
              onClick={() => onNavigateTo('followups')}
              className="text-xs font-semibold text-indigo-400 hover:text-white flex items-center gap-1"
            >
              All Tasks <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            {metrics.upcoming_followups?.length > 0 ? (
              metrics.upcoming_followups.map((fup) => (
                <div key={fup.id} className="flex gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 transition-colors hover:border-slate-700">
                  <div className="mt-0.5 shrink-0">
                    {fup.priority === 'High' ? (
                      <div className="h-8 w-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                        <Clock className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="grow">
                    <div className="flex justify-between items-start">
                      <h5 className="text-xs font-bold text-white">{fup.hcp_name}</h5>
                      <span className="text-[10px] text-slate-500 font-medium">Due: {new Date(fup.due_date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[10px] text-indigo-400 font-medium mt-0.5">{fup.specialty}</p>
                    <p className="text-xs text-slate-400 mt-2 font-normal line-clamp-2">{fup.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                No active detailing tasks found.
              </div>
            )}
          </div>
        </div>

        {/* Right: High priority Clinicians */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">High-Priority Targets</h4>
            <button 
              onClick={() => onNavigateTo('hcp-management')}
              className="text-xs font-semibold text-indigo-400 hover:text-white flex items-center gap-1"
            >
              HCP Catalog <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/60">
            {metrics.high_priority_hcps?.length > 0 ? (
              metrics.high_priority_hcps.map((hcp) => (
                <div key={hcp.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div>
                    <h5 className="text-sm font-semibold text-white">{hcp.name}</h5>
                    <p className="text-xs text-slate-400 mt-0.5">{hcp.specialty} • {hcp.hospital}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-md">
                      {hcp.priority}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {hcp.last_interaction ? `Last: ${new Date(hcp.last_interaction).toLocaleDateString()}` : 'No recent meetings'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                No high-priority clinical targets identified.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
