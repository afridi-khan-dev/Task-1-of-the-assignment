import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/authSlice'
import { 
  LayoutDashboard, 
  PenTool, 
  Users, 
  History, 
  CalendarCheck, 
  LogOut, 
  Activity, 
  ShieldAlert
} from 'lucide-react'

export default function Sidebar({ currentPage, setCurrentPage }) {
  const dispatch = useDispatch()
  const { username, role } = useSelector((state) => state.auth)

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Cockpit', icon: LayoutDashboard },
    { id: 'log-interaction', label: 'Log Interaction', icon: PenTool },
    { id: 'hcp-management', label: 'HCP Directory', icon: Users },
    { id: 'interaction-history', label: 'Interaction Timeline', icon: History },
    { id: 'followups', label: 'Follow-ups Task', icon: CalendarCheck },
  ]

  const handleLogout = () => {
    dispatch(logout())
  }

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 w-64 border-r border-slate-800 bg-[#0A1124] p-6 flex flex-col justify-between">
      
      <div>
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <Activity className="h-6 w-6 text-indigo-500 animate-pulse" />
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-500 bg-clip-text text-transparent">
            MedPulse CRM
          </span>
        </div>

        {/* Nav list */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 focus:outline-none ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* User profile bottom */}
      <div className="border-t border-slate-800 pt-6">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
            {username?.charAt(0).toUpperCase() || 'R'}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-white truncate">{username}</h4>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-indigo-400 font-medium truncate">
              <ShieldAlert className="h-3 w-3 shrink-0" />
              <span>{role}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-800 text-slate-400 font-medium text-sm hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5 transition-colors focus:outline-none"
        >
          <LogOut className="h-4 w-4" />
          End detaiSession
        </button>
      </div>

    </aside>
  )
}
