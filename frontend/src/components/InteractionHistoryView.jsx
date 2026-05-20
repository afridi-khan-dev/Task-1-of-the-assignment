import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { 
  Calendar, 
  MessageSquare, 
  Sparkles, 
  Activity, 
  PenTool, 
  Clock, 
  Check, 
  User, 
  Bookmark, 
  Bot,
  RefreshCw
} from 'lucide-react'
import { interactionAPI } from '../services/api'
import { interactionEditSuccess, interactionFailure, interactionStart } from '../store/interactionSlice'

export default function InteractionHistoryView({ interactions, products, onRefresh }) {
  const dispatch = useDispatch()
  const [editingItem, setEditingItem] = useState(null)
  
  // --- Edit Modal State ---
  const [editChannel, setEditChannel] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editRawInput, setEditRawInput] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [editSentiment, setEditSentiment] = useState('Neutral')
  const [editProducts, setEditProducts] = useState([])
  const [editFollowupDate, setEditFollowupDate] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')

  const handleEditClick = (item) => {
    setEditingItem(item)
    setEditChannel(item.interaction_type)
    setEditDate(item.interaction_date)
    setEditRawInput(item.raw_input)
    setEditSummary(item.summary)
    setEditSentiment(item.sentiment)
    setEditProducts(item.products_discussed || [])
    setEditFollowupDate(item.follow_up_date || '')
    setEditError('')
  }

  const handleProductToggle = (prodName) => {
    if (editProducts.includes(prodName)) {
      setEditProducts(editProducts.filter(p => p !== prodName))
    } else {
      setEditProducts([...editProducts, prodName])
    }
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    setEditSubmitting(true)
    setEditError('')

    try {
      const result = await interactionAPI.edit(editingItem.id, {
        interaction_type: editChannel,
        interaction_date: editDate,
        raw_input: editRawInput,
        summary: editSummary,
        sentiment: editSentiment,
        products_discussed: editProducts,
        follow_up_date: editFollowupDate || null
      })

      if (result.status === 'success') {
        dispatch(interactionEditSuccess(result))
        setEditingItem(null)
        if (onRefresh) onRefresh()
      } else {
        setEditError(result.error || 'Failed to update detailing record.')
      }
    } catch (err) {
      setEditError(err.response?.data?.detail || 'Failed to sync modifications.')
    } finally {
      setEditSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 pb-12">
      
      {interactions.length > 0 ? (
        <div className="relative border-l-2 border-slate-800 ml-4 pl-8 space-y-10">
          {interactions.map((item) => (
            
            <div key={item.id} className="relative group">
              {/* Timeline dot */}
              <div className="absolute -left-[41px] top-1.5 h-6 w-6 rounded-full bg-slate-950 border-2 border-indigo-600 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Activity className="h-3 w-3" />
              </div>

              {/* Main Content card */}
              <div className="glass-panel rounded-2xl p-6 transition-all hover:border-slate-700/80">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div>
                    <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                      <User className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      {item.hcp?.name || 'Dr. Target clinician'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {item.hcp?.specialty} • {item.hcp?.hospital}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Sentiment */}
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                      item.sentiment === 'Positive' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : item.sentiment === 'Negative'
                        ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {item.sentiment}
                    </span>

                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>{new Date(item.interaction_date).toLocaleDateString()}</span>
                    </div>

                    {/* Channel */}
                    <span className="text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      {item.interaction_type}
                    </span>

                    {/* Edit button */}
                    <button
                      onClick={() => handleEditClick(item)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-500 bg-indigo-500/5 px-2.5 py-1 rounded transition-colors focus:outline-none"
                    >
                      <PenTool className="h-3 w-3 shrink-0" />
                      Edit Log
                    </button>
                  </div>
                </div>

                {/* Products multi-tags */}
                {item.products_discussed?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.products_discussed.map((prod, idx) => (
                      <span key={idx} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide bg-indigo-500/10 text-indigo-300 border border-indigo-500/10 px-2 py-0.5 rounded">
                        <Bookmark className="h-2.5 w-2.5 text-indigo-400" />
                        {prod}
                      </span>
                    ))}
                  </div>
                )}

                {/* Grid Split: Left Raw Notes, Right AI CRM Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 pt-4 border-t border-slate-800/40">
                  
                  {/* Left: Rep Notes */}
                  <div>
                    <h5 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                      <MessageSquare className="h-3.5 w-3.5 text-slate-600" /> Field detaiNotes
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed italic bg-slate-900/20 border border-slate-800/20 p-3 rounded-xl">
                      "{item.raw_input}"
                    </p>
                  </div>

                  {/* Right: AI Summary */}
                  <div>
                    <h5 className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                      <Bot className="h-3.5 w-3.5 text-indigo-500" /> AI-Generated CRM detaiLog
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed font-normal bg-indigo-950/5 border border-indigo-900/10 p-3 rounded-xl shadow-inner">
                      {item.summary}
                    </p>
                  </div>

                </div>

                {/* Task schedule footer */}
                {item.follow_up_date && (
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold text-indigo-400">
                    <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span>Follow-up schedule registered by {new Date(item.follow_up_date).toLocaleDateString()}</span>
                  </div>
                )}

              </div>
            </div>

          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-500 text-xs">
          No detailing history recorded in database timelines.
        </div>
      )}

      {/* --- Edit Interaction Modal --- */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050814]/80 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-[#0B1329] p-8 shadow-2xl">
            
            <h3 className="text-lg font-bold text-white tracking-tight mb-2">Modify Detailing Log Record</h3>
            <p className="text-xs text-slate-400 mb-6">
              Edits will re-trigger compliance validation, sync summaries, and schedule updates.
            </p>
            
            {editError && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-400">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-5">
              
              {/* Row 1: Channel, Date, Sentiment */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Channel</label>
                  <select
                    className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    value={editChannel}
                    onChange={(e) => setEditChannel(e.target.value)}
                  >
                    <option value="In-Person">In-Person detailing visit</option>
                    <option value="Video Call">Video Call detaiLog</option>
                    <option value="Email">Email Detailing brief</option>
                    <option value="Phone">Phone detaiSync</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Visit Date</label>
                  <input
                    type="date"
                    required
                    className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Engagement Sentiment</label>
                  <select
                    className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    value={editSentiment}
                    onChange={(e) => setEditSentiment(e.target.value)}
                  >
                    <option value="Positive">Positive engagement</option>
                    <option value="Neutral">Neutral response</option>
                    <option value="Negative">Negative disinterest</option>
                  </select>
                </div>

              </div>

              {/* Products discussed checklists */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Products Discussed</label>
                <div className="flex flex-wrap gap-2">
                  {products.map((prod) => {
                    const isChecked = editProducts.includes(prod.name)
                    return (
                      <button
                        type="button"
                        key={prod.id}
                        onClick={() => handleProductToggle(prod.name)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-semibold border transition-colors ${
                          isChecked 
                            ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400' 
                            : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
                        }`}
                      >
                        {prod.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Visit Notes */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Visit Detailing Notes</label>
                <textarea
                  rows={2}
                  required
                  className="w-full rounded-xl border border-slate-800 bg-[#111B35] p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  value={editRawInput}
                  onChange={(e) => setEditRawInput(e.target.value)}
                />
              </div>

              {/* Summary manual override */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Summary override</label>
                <textarea
                  rows={2}
                  className="w-full rounded-xl border border-slate-800 bg-[#111B35] p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  placeholder="Leave blank to let AI regenerate, or edit manual text."
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                />
              </div>

              {/* Row 3: Follow up Limit */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Follow-up schedule limit</label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  value={editFollowupDate}
                  onChange={(e) => setEditFollowupDate(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="grow flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2.5 text-xs font-bold text-white shadow-lg transition-colors disabled:bg-indigo-600/40"
                >
                  <RefreshCw className={`h-4 w-4 shrink-0 ${editSubmitting ? 'animate-spin' : ''}`} />
                  {editSubmitting ? 'Regenerating & Syncing with AI...' : 'Recalculate with AI & Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-800 text-xs font-medium text-slate-400 hover:bg-slate-800/40 transition-colors"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
