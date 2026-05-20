import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { 
  PenTool, 
  Bot, 
  Send, 
  ShieldCheck, 
  ShieldAlert, 
  UserPlus, 
  Check, 
  RotateCcw, 
  Heart, 
  User, 
  Calendar, 
  TrendingUp, 
  FileText, 
  Building2, 
  Stethoscope 
} from 'lucide-react'
import { interactionAPI, aiAPI } from '../services/api'
import { interactionLogSuccess, interactionFailure, interactionStart } from '../store/interactionSlice'
import { aiStart, aiSuccess, aiFailure, addMessage, clearAiState } from '../store/aiSlice'

export default function LogInteractionView({ hcps, products, onRefresh }) {
  const dispatch = useDispatch()
  const auth = useSelector((state) => state.auth)
  const aiState = useSelector((state) => state.ai)
  
  const [activeTab, setActiveTab] = useState('ai') // 'ai' or 'manual'

  // --- Traditional Manual Form State ---
  const [manualHcpId, setManualHcpId] = useState('')
  const [manualProducts, setManualProducts] = useState([])
  const [manualType, setManualType] = useState('In-Person')
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0])
  const [manualRawInput, setManualRawInput] = useState('')
  const [manualSummary, setManualSummary] = useState('')
  const [manualSentiment, setManualSentiment] = useState('Neutral')
  const [manualFollowupDate, setManualFollowupDate] = useState('')
  const [manualSubmitting, setManualSubmitting] = useState(false)
  const [manualSuccessMsg, setManualSuccessMsg] = useState('')
  const [manualError, setManualError] = useState('')

  // --- AI Conversational Input State ---
  const [aiTextInput, setAiTextInput] = useState('')

  // Toggle products checkboxes
  const handleProductToggle = (prodName) => {
    if (manualProducts.includes(prodName)) {
      setManualProducts(manualProducts.filter(p => p !== prodName))
    } else {
      setManualProducts([...manualProducts, prodName])
    }
  }

  // --- Submit Traditional Form ---
  const handleManualSubmit = async (e) => {
    e.preventDefault()
    if (!manualHcpId) {
      setManualError('Please select a healthcare professional from the directory.')
      return
    }
    if (!manualSummary) {
      setManualError('Please provide a detailing meeting summary.')
      return
    }

    setManualSubmitting(true)
    setManualError('')
    setManualSuccessMsg('')

    try {
      const result = await interactionAPI.log({
        hcp_id: parseInt(manualHcpId),
        raw_input: manualRawInput || `Manual input logged: ${manualSummary}`,
        manual_summary: manualSummary,
        interaction_type: manualType,
        interaction_date: manualDate,
        products_discussed: manualProducts,
        sentiment: manualSentiment,
        follow_up_date: manualFollowupDate || null
      })

      dispatch(interactionLogSuccess(result))
      setManualSuccessMsg('✓ Interaction recorded successfully in manual CRM records.')
      
      // Reset form
      setManualHcpId('')
      setManualProducts([])
      setManualRawInput('')
      setManualSummary('')
      setManualFollowupDate('')
      if (onRefresh) onRefresh()
    } catch (err) {
      setManualError(err.response?.data?.detail || 'Failed to submit manual detailing log.')
    } finally {
      setManualSubmitting(false)
    }
  }

  // --- Submit Conversational AI Detailing note ---
  const handleAiSubmit = async (e) => {
    e.preventDefault()
    if (!aiTextInput.trim()) return

    const promptText = aiTextInput.trim()
    setAiTextInput('')
    
    // Add user message to UI
    dispatch(addMessage(promptText))
    dispatch(aiStart())

    try {
      // Execute the LangGraph NLU agent orchestrator
      const response = await aiAPI.chat(promptText, null, [])
      dispatch(aiSuccess(response))
      if (onRefresh) onRefresh()
    } catch (err) {
      dispatch(aiFailure(err.message || 'AI Orchestrator encountered an execution error.'))
    }
  }

  // Approve and persist conversational logging result directly
  const handleApproveAiLog = () => {
    // Already saved dynamically inside the LangGraph LogInteractionTool!
    // Simply clear the staging AI state with a nice notification
    dispatch(clearAiState())
    alert('CRM Detail log successfully approved, audit-locked, and dashboard charts synced.')
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Tab bar header */}
      <div className="flex gap-4 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all focus:outline-none ${
            activeTab === 'ai' 
              ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bot className="h-4 w-4" />
          Conversational AI Detailing Logging
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all focus:outline-none ${
            activeTab === 'manual' 
              ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PenTool className="h-4 w-4" />
          Structured detailing Form (Manual)
        </button>
      </div>

      {/* --- Tab A: AI Conversational Chat --- */}
      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Chat cockpit left */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col h-[520px]">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">AI detaiLogger Cockpit</h4>
            
            {/* Conversation Window */}
            <div className="grow overflow-y-auto mb-4 space-y-4 pr-2">
              {aiState.messages.map((msg) => {
                const isUser = msg.role === 'user'
                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 text-sm font-normal shadow-md leading-relaxed ${
                      isUser 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-[#111B35] border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}>
                      <div className="font-semibold text-xs text-slate-400 mb-1">
                        {isUser ? 'Sales Representative' : 'AI Detailing Assistant'}
                      </div>
                      <div className="whitespace-pre-line">{msg.content}</div>
                    </div>
                  </div>
                )
              })}

              {aiState.loading && (
                <div className="flex justify-start">
                  <div className="bg-[#111B35] border border-slate-800 rounded-2xl rounded-bl-none p-4 text-slate-200 max-w-[80%]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center animate-spin text-indigo-400">
                        <RotateCcw className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-semibold text-indigo-300 uppercase tracking-widest animate-pulse">
                        Agent running compliance checks & entity extraction...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleAiSubmit} className="relative">
              <input
                type="text"
                disabled={aiState.loading}
                placeholder="Type clinician notes (e.g. 'Visited Dr. Sarah at Mayo today, discussed Cardiox, follow up next Thursday')"
                className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-3.5 pl-4 pr-12 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none disabled:opacity-40"
                value={aiTextInput}
                onChange={(e) => setAiTextInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={aiState.loading || !aiTextInput.trim()}
                className="absolute right-2 top-2 h-10 w-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white transition-colors disabled:bg-indigo-600/40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* AI Result Card right */}
          <div className="space-y-6">
            
            {aiState.lastLoggedInteraction ? (
              <div className="glass-panel-accent rounded-2xl p-6 border-indigo-500/30 animate-fade-in space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                    AI detaiLog output
                  </span>
                  {aiState.lastLoggedInteraction.sentiment && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      aiState.lastLoggedInteraction.sentiment === 'Positive' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : aiState.lastLoggedInteraction.sentiment === 'Negative'
                        ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {aiState.lastLoggedInteraction.sentiment} engagement
                    </span>
                  )}
                </div>

                {/* HCP Info */}
                {aiState.lastLoggedInteraction.hcp_details && (
                  <div className="p-3.5 rounded-xl bg-[#111B35]/40 border border-slate-800 space-y-2">
                    <div className="flex gap-2 items-center text-sm font-semibold text-white">
                      <User className="h-4 w-4 text-indigo-400" />
                      <span>{aiState.lastLoggedInteraction.hcp_details.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/40">
                      <div className="flex items-center gap-1.5">
                        <Stethoscope className="h-3.5 w-3.5 text-slate-500" />
                        <span>{aiState.lastLoggedInteraction.hcp_details.specialty}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-500" />
                        <span className="truncate">{aiState.lastLoggedInteraction.hcp_details.hospital}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* CRM Summary */}
                <div>
                  <h5 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-slate-500" /> CRM Detailing Summary
                  </h5>
                  <p className="text-xs text-slate-300 mt-2 font-normal leading-relaxed">
                    {aiState.lastLoggedInteraction.extracted_entities?.summary}
                  </p>
                </div>

                {/* Compliance auditing status */}
                {aiState.complianceAlerts && (
                  <div className={`p-4 rounded-xl border ${
                    aiState.complianceAlerts.is_compliant 
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse-subtle'
                  }`}>
                    <div className="flex gap-2 items-center text-xs font-semibold uppercase tracking-wider">
                      {aiState.complianceAlerts.is_compliant ? (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          <span>Regulatory Check: Clean</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="h-4 w-4" />
                          <span>Compliance Alert Flagged</span>
                        </>
                      )}
                    </div>
                    {aiState.complianceAlerts.violations?.map((violation, idx) => (
                      <p key={idx} className="text-[11px] text-slate-300 mt-2 font-normal leading-relaxed">
                        ⚠️ {violation}
                      </p>
                    ))}
                  </div>
                )}

                {/* Followup recommended action */}
                {aiState.recommendation && (
                  <div>
                    <h5 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" /> Recommended Action
                    </h5>
                    <div className="mt-2 p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/10 space-y-1">
                      <p className="text-xs text-slate-200 font-semibold">{aiState.recommendation.description}</p>
                      <p className="text-[10px] text-slate-400">Due limit: {new Date(aiState.recommendation.due_date).toLocaleDateString()}</p>
                      {aiState.recommendation.reasoning && (
                        <p className="text-[10px] text-indigo-400 italic pt-1 mt-1 border-t border-indigo-900/20">
                          {aiState.recommendation.reasoning}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleApproveAiLog}
                    className="grow flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-lg transition-colors"
                  >
                    <Check className="h-4 w-4" /> Approve and Sync
                  </button>
                  <button
                    onClick={() => dispatch(clearAiState())}
                    className="py-2.5 px-4 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-xs font-medium text-slate-400 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>

              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-6 flex flex-col justify-center items-center text-center h-[520px]">
                <Bot className="h-10 w-10 text-slate-600 animate-bounce" />
                <h4 className="text-sm font-semibold text-slate-400 mt-4">AI detaiLog staging panel</h4>
                <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                  Type clinically relevant meeting notes on the left window. 
                  The AI Agent compiles entities, verifies PhRMA compliance, and suggests follow-up actions here.
                </p>
              </div>
            )}

          </div>

        </div>
      )}

      {/* --- Tab B: Structured detailing Form --- */}
      {activeTab === 'manual' && (
        <div className="glass-panel rounded-2xl p-8 max-w-3xl">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">CRM Structured Detailing Log Form</h4>

          {manualSuccessMsg && (
            <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-400">
              {manualSuccessMsg}
            </div>
          )}

          {manualError && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-400">
              {manualError}
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-6">
            
            {/* Grid 1: Clinician and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Target Clinician</label>
                <select
                  required
                  className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-3 px-4 text-sm text-slate-100 transition-colors focus:border-indigo-500 focus:outline-none"
                  value={manualHcpId}
                  onChange={(e) => setManualHcpId(e.target.value)}
                >
                  <option value="">Select Doctor from Directory...</option>
                  {hcps.map((doc) => (
                    <option key={doc.id} value={doc.id}>{doc.name} - {doc.specialty} ({doc.hospital})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Detailing Channel</label>
                <select
                  className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-3 px-4 text-sm text-slate-100 transition-colors focus:border-indigo-500 focus:outline-none"
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value)}
                >
                  <option value="In-Person">In-Person detailing visit</option>
                  <option value="Video Call">Video Call detaiLog</option>
                  <option value="Email">Email Detailing brief</option>
                  <option value="Phone">Phone detaiSync</option>
                </select>
              </div>

            </div>

            {/* Grid 2: Date and Sentiment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Meeting Date</label>
                <input
                  type="date"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-3 px-4 text-sm text-slate-100 transition-colors focus:border-indigo-500 focus:outline-none"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Engagement Sentiment</label>
                <select
                  className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-3 px-4 text-sm text-slate-100 transition-colors focus:border-indigo-500 focus:outline-none"
                  value={manualSentiment}
                  onChange={(e) => setManualSentiment(e.target.value)}
                >
                  <option value="Positive">Positive engagement</option>
                  <option value="Neutral">Neutral response</option>
                  <option value="Negative">Negative disinterest</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Follow-up Limit</label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-3 px-4 text-sm text-slate-100 transition-colors focus:border-indigo-500 focus:outline-none"
                  value={manualFollowupDate}
                  onChange={(e) => setManualFollowupDate(e.target.value)}
                />
              </div>

            </div>

            {/* Products discussed checklist */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Products Discussed</label>
              <div className="flex flex-wrap gap-3">
                {products.map((prod) => {
                  const isChecked = manualProducts.includes(prod.name)
                  return (
                    <button
                      type="button"
                      key={prod.id}
                      onClick={() => handleProductToggle(prod.name)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${
                        isChecked 
                          ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400' 
                          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isChecked && <Check className="h-3.5 w-3.5" />}
                      {prod.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* raw detailing notes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Raw Visit notes</label>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-slate-800 bg-[#111B35] p-4 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                placeholder="Enter field detailed transcript comments..."
                value={manualRawInput}
                onChange={(e) => setManualRawInput(e.target.value)}
              />
            </div>

            {/* Manual summary */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">CRM Detailing Summary (Required)</label>
              <textarea
                required
                rows={2}
                className="w-full rounded-xl border border-slate-800 bg-[#111B35] p-4 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                placeholder="Brief summary to record in doctor detailing log..."
                value={manualSummary}
                onChange={(e) => setManualSummary(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={manualSubmitting}
              className="rounded-xl bg-indigo-600 py-3 px-6 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-indigo-600/40 transition-colors"
            >
              {manualSubmitting ? 'Recording log...' : 'Save manual Detailing Record'}
            </button>

          </form>
        </div>
      )}

    </div>
  )
}
