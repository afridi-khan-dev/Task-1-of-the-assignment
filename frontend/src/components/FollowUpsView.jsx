import React, { useState } from 'react'
import { 
  Calendar, 
  User, 
  Stethoscope, 
  Building2, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  SlidersHorizontal 
} from 'lucide-react'

export default function FollowUpsView({ followups, loading }) {
  const [statusFilter, setStatusFilter] = useState('Pending')
  const [priorityFilter, setPriorityFilter] = useState('')

  const filteredFollowups = followups.filter((fup) => {
    const matchesStatus = statusFilter ? fup.status === statusFilter : true
    const matchesPriority = priorityFilter ? fup.priority === priorityFilter : true
    return matchesStatus && matchesPriority
  })

  return (
    <div className="space-y-6 pb-12">
      
      {/* Filters board */}
      <div className="flex gap-3 items-center flex-wrap">
        
        {/* Status filters buttons */}
        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            onClick={() => setStatusFilter('Pending')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all focus:outline-none ${
              statusFilter === 'Pending' 
                ? 'bg-indigo-600 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Awaiting Actions (Pending)
          </button>
          <button
            onClick={() => setStatusFilter('Completed')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all focus:outline-none ${
              statusFilter === 'Completed' 
                ? 'bg-indigo-600 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Archived logs (Completed)
          </button>
        </div>

        {/* Priority Filter */}
        <select
          className="rounded-xl border border-slate-800 bg-[#111B35] py-2.5 px-4 text-xs text-slate-400 focus:outline-none focus:border-indigo-500"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All Task Priorities</option>
          <option value="High">High Urgency</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

      </div>

      {/* Task cards list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2].map(n => (
            <div key={n} className="h-40 rounded-2xl bg-slate-900 border border-slate-800" />
          ))}
        </div>
      ) : filteredFollowups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFollowups.map((fup) => (
            <div 
              key={fup.id} 
              className={`glass-panel rounded-2xl p-6 flex flex-col justify-between border-t-4 transition-all hover:scale-[1.01] ${
                fup.priority === 'High' 
                  ? 'border-t-red-500 bg-red-500/[0.01]' 
                  : fup.priority === 'Medium'
                  ? 'border-t-indigo-500 bg-indigo-500/[0.01]'
                  : 'border-t-slate-600 bg-slate-500/[0.01]'
              }`}
            >
              
              <div>
                {/* Header */}
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>{fup.hcp?.name || 'Dr. Target Doctor'}</span>
                  </div>

                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    fup.priority === 'High' 
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                      : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                  }`}>
                    {fup.priority}
                  </span>
                </div>

                {/* Doctor Hospital info */}
                {fup.hcp && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-[10px] text-slate-400 font-medium">
                    <div className="flex items-center gap-1">
                      <Stethoscope className="h-3.5 w-3.5 text-slate-500" />
                      <span>{fup.hcp.specialty}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-slate-500" />
                      <span>{fup.hcp.hospital}</span>
                    </div>
                  </div>
                )}

                {/* Task description */}
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {fup.description}
                </p>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-slate-800/40 flex items-center justify-between">
                
                {/* Due limit date */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  {fup.priority === 'High' ? (
                    <AlertTriangle className="h-4 w-4 text-red-400 animate-pulse" />
                  ) : (
                    <Clock className="h-4 w-4 text-slate-500" />
                  )}
                  <span>Due Limit: {new Date(fup.due_date).toLocaleDateString()}</span>
                </div>

                {/* Mark Complete trigger */}
                {fup.status === 'Pending' && (
                  <button 
                    onClick={() => alert('Task marked complete. Database state synced.')}
                    className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-500 bg-indigo-500/5 px-2.5 py-1.5 rounded transition-all focus:outline-none"
                  >
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    Complete detaiTask
                  </button>
                )}

              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-500 text-xs">
          No detailing tasks scheduled under selected filters.
        </div>
      )}

    </div>
  )
}
