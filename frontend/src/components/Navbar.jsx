import React from 'react'
import { Calendar, Bot, RefreshCw } from 'lucide-react'

export default function Navbar({ currentPage, onSync }) {
  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Dashboard Cockpit'
      case 'log-interaction':
        return 'Log Interaction Detailing'
      case 'hcp-management':
        return 'Healthcare Professionals Directory'
      case 'interaction-history':
        return 'Detalled Meeting History'
      case 'followups':
        return 'Scheduled Follow-up Actions'
      default:
        return 'Cockpit Console'
    }
  }

  // Format today's date
  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <header className="fixed top-0 right-0 left-64 z-30 h-16 border-b border-slate-800 bg-[#070C1B]/80 backdrop-blur-md px-8 flex items-center justify-between">
      
      {/* Title */}
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight">{getPageTitle()}</h1>
      </div>

      {/* Right side options */}
      <div className="flex items-center gap-6">
        
        {/* Sync Button */}
        {onSync && (
          <button 
            onClick={onSync}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-medium text-slate-400 hover:text-white hover:border-slate-600 transition-colors focus:outline-none"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh CRM
          </button>
        )}

        {/* AI Agent Status badge */}
        <div className="flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-3.5 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">
            <Bot className="h-3.5 w-3.5 shrink-0" />
            <span>Agent Orchestrator: Online</span>
          </div>
        </div>

        {/* Date display */}
        <div className="flex items-center gap-2 text-sm text-slate-400 border-l border-slate-800 pl-6">
          <Calendar className="h-4 w-4 text-slate-500" />
          <span>{getFormattedDate()}</span>
        </div>

      </div>

    </header>
  )
}
