import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { authStart, authSuccess, authFailure, clearAuthError } from '../store/authSlice'
import { authAPI } from '../services/api'
import { Lock, User, Activity, AlertTriangle } from 'lucide-react'

export default function LoginModal() {
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.auth)
  
  const [username, setUsername] = useState('salesrep') // Seeded default
  const [password, setPassword] = useState('password123') // Seeded default
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Sales Representative')

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(authStart())
    try {
      if (isRegister) {
        // Register first
        await authAPI.register({ username, email, password, role })
        // Then login
        const data = await authAPI.login(username, password)
        dispatch(authSuccess(data))
      } else {
        const data = await authAPI.login(username, password)
        dispatch(authSuccess(data))
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Authentication failed. Please verify credentials.'
      dispatch(authFailure(errMsg))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050814]/90 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#0B1329] p-8 shadow-2xl">
        
        {/* Branding header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-500 shadow-inner animate-pulse-indigo">
            <Activity className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">MedPulse AI-CRM</h2>
          <p className="text-sm text-slate-400 mt-1">
            {isRegister ? 'Register your life sciences credentials' : 'HCP CockpitDetailing authentication'}
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="text"
                required
                className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 transition-colors focus:border-indigo-500 focus:outline-none"
                placeholder="Enter salesrep or custom"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
              <input
                type="email"
                required
                className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-3 px-4 text-slate-100 placeholder-slate-500 transition-colors focus:border-indigo-500 focus:outline-none"
                placeholder="doctor.rep@pharma.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="password"
                required
                className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 transition-colors focus:border-indigo-500 focus:outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Account Role</label>
              <select
                className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-3 px-4 text-slate-100 transition-colors focus:border-indigo-500 focus:outline-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Sales Representative">Sales Representative (MSL)</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-indigo-700 disabled:bg-indigo-600/40"
          >
            {loading ? 'Validating credentials...' : isRegister ? 'Register & Access Cockpit' : 'Authenticate Access'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister)
              dispatch(clearAuthError())
            }}
            className="text-xs text-indigo-400 transition-colors hover:text-indigo-300 focus:outline-none"
          >
            {isRegister ? 'Already registered? Authenticate here' : 'Need new enterprise access? Register here'}
          </button>
        </div>
      </div>
    </div>
  )
}
