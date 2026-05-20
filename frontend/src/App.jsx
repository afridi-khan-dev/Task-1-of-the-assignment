import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { authSuccess, authFailure } from './store/authSlice'
import { hcpStart, hcpFetchSuccess, hcpFailure } from './store/hcpSlice'
import { interactionStart, interactionFetchSuccess, interactionFailure } from './store/interactionSlice'
import { dashboardStart, dashboardSuccess, dashboardFailure } from './store/dashboardSlice'
import { authAPI, hcpAPI, interactionAPI, followupAPI, dashboardAPI } from './services/api'

import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import LoginModal from './components/LoginModal'
import DashboardView from './components/DashboardView'
import LogInteractionView from './components/LogInteractionView'
import HcpManagementView from './components/HcpManagementView'
import InteractionHistoryView from './components/InteractionHistoryView'
import FollowUpsView from './components/FollowUpsView'
import VoiceAssistant from './components/VoiceAssistant'

export default function App() {
  const dispatch = useDispatch()
  
  // Auth state
  const { isAuthenticated, token } = useSelector((state) => state.auth)
  
  // Global domain state
  const hcps = useSelector((state) => state.hcps)
  const interactions = useSelector((state) => state.interactions)
  const dashboard = useSelector((state) => state.dashboard)
  
  const [followups, setFollowups] = useState([])
  const [followupsLoading, setFollowupsLoading] = useState(false)
  
  // State-based navigation router
  const [currentPage, setCurrentPage] = useState('dashboard')

  // --- Auto-Login for instant WOW experience ---
  useEffect(() => {
    const attemptAutoLogin = async () => {
      const storedToken = localStorage.getItem('token')
      if (!storedToken) {
        // Silent auto-login seeded test user on first boot for extreme user convenience
        try {
          const data = await authAPI.login('salesrep', 'password123')
          dispatch(authSuccess(data))
        } catch (err) {
          // If seeding wasn't run yet, let them log in manually
          dispatch(authFailure(null))
        }
      }
    };
    attemptAutoLogin()
  }, [dispatch])

  // --- Fetch CRM timelines and dashboards ---
  const fetchAllData = async () => {
    if (!isAuthenticated) return

    // 1. Dashboard analytics metrics
    dispatch(dashboardStart())
    try {
      const metrics = await dashboardAPI.metrics()
      dispatch(dashboardSuccess(metrics))
    } catch (err) {
      dispatch(dashboardFailure(err.message || 'Failed to fetch dashboard metrics.'))
    }

    // 2. Clinicians directory list
    dispatch(hcpStart())
    try {
      const doctorList = await hcpAPI.list()
      dispatch(hcpFetchSuccess(doctorList))
    } catch (err) {
      dispatch(hcpFailure(err.message || 'Failed to fetch clinician directory.'))
    }

    // 3. Interactions History list
    dispatch(interactionStart())
    try {
      const timeline = await interactionAPI.list()
      dispatch(interactionFetchSuccess(timeline))
    } catch (err) {
      dispatch(interactionFailure(err.message || 'Failed to load timeline records.'))
    }

    // 4. Outstanding followups tasks
    setFollowupsLoading(true)
    try {
      const tasks = await followupAPI.list()
      setFollowups(tasks)
    } catch (err) {
      console.error(err)
    } finally {
      setFollowupsLoading(false)
    }
  }

  // Trigger data reload on auth success or manual sync
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData()
    }
  }, [isAuthenticated])

  // Simple catalog products definition
  const catalogProducts = [
    { id: 1, name: 'Cardiox', category: 'Cardiology' },
    { id: 2, name: 'GlycaCare', category: 'Endocrinology' },
    { id: 3, name: 'Lipidex', category: 'Cardiology' },
    { id: 4, name: 'NephroGard', category: 'Nephrology' },
    { id: 5, name: 'OncoStop', category: 'Oncology' }
  ]

  // Render appropriate view based on active sidebar tab
  const renderCurrentView = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <DashboardView 
            metrics={dashboard.metrics} 
            loading={dashboard.loading} 
            onNavigateTo={(page) => setCurrentPage(page)} 
          />
        )
      case 'log-interaction':
        return (
          <LogInteractionView 
            hcps={hcps.list} 
            products={catalogProducts} 
            onRefresh={fetchAllData} 
          />
        )
      case 'hcp-management':
        return (
          <HcpManagementView 
            hcps={hcps.list} 
            loading={hcps.loading} 
            onRefresh={fetchAllData} 
          />
        )
      case 'interaction-history':
        return (
          <InteractionHistoryView 
            interactions={interactions.list} 
            products={catalogProducts} 
            onRefresh={fetchAllData} 
          />
        )
      case 'followups':
        return (
          <FollowUpsView 
            followups={followups} 
            loading={followupsLoading} 
          />
        )
      default:
        return (
          <div className="py-12 text-center text-slate-500 text-sm">
            Section under active construction.
          </div>
        )
    }
  }

  // If not logged in, render the login panel only
  if (!isAuthenticated) {
    return <LoginModal />
  }

  return (
    <div className="min-h-screen bg-[#070C1B] text-slate-100 flex">
      
      {/* 1. Sidebar Left */}
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {/* 2. Right Main Cockpit Area */}
      <div className="grow pl-64 flex flex-col min-h-screen relative">
        
        {/* Top Header Navbar */}
        <Navbar currentPage={currentPage} onSync={fetchAllData} />
        
        {/* Dynamic page container */}
        <main className="grow pt-24 px-8 pb-8 max-w-7xl w-full mx-auto">
          {renderCurrentView()}
        </main>

        {/* AI Voice Assistant Drawer */}
        <VoiceAssistant onRefresh={fetchAllData} />

      </div>

    </div>
  )
}
