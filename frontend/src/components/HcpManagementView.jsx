import React, { useState } from 'react'
import { 
  UserPlus, 
  Search, 
  MapPin, 
  Mail, 
  Phone, 
  SlidersHorizontal, 
  Plus, 
  Activity,
  Heart,
  Stethoscope
} from 'lucide-react'
import { hcpAPI } from '../services/api'

export default function HcpManagementView({ hcps, loading, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // --- Add HCP Modal form states ---
  const [newName, setNewName] = useState('')
  const [newSpecialty, setNewSpecialty] = useState('Cardiology')
  const [newHospital, setNewHospital] = useState('')
  const [newCity, setNewCity] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newPriority, setNewPriority] = useState('Medium')
  const [newSubmitting, setNewSubmitting] = useState(false)
  const [newError, setNewError] = useState('')

  // Filter clinicians
  const filteredHcps = hcps.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.hospital.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSpecialty = specialtyFilter ? doc.specialty === specialtyFilter : true
    const matchesPriority = priorityFilter ? doc.priority === priorityFilter : true

    return matchesSearch && matchesSpecialty && matchesPriority
  })

  // Get unique specialties for filter dropdown
  const uniqueSpecialties = Array.from(new Set(hcps.map(doc => doc.specialty)))

  const handleAddHcp = async (e) => {
    e.preventDefault()
    setNewSubmitting(true)
    setNewError('')

    try {
      await hcpAPI.create({
        name: newName,
        specialty: newSpecialty,
        hospital: newHospital,
        city: newCity,
        email: newEmail || null,
        phone: newPhone || null,
        priority: newPriority,
        status: 'Active'
      })

      // Reset
      setNewName('')
      setNewHospital('')
      setNewCity('')
      setNewEmail('')
      setNewPhone('')
      setNewPriority('Medium')
      setIsAddModalOpen(false)
      if (onRefresh) onRefresh()
    } catch (err) {
      setNewError(err.response?.data?.detail || 'Failed to register healthcare professional.')
    } finally {
      setNewSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Search and Filters panel */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3 grow w-full md:w-auto">
          {/* Search bar */}
          <div className="relative grow md:grow-0 md:w-80">
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search clinician by name, clinic..."
              className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Specialty selection */}
          <select
            className="rounded-xl border border-slate-800 bg-[#111B35] py-2.5 px-4 text-xs text-slate-400 focus:border-indigo-500 focus:outline-none"
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
          >
            <option value="">All Specialties</option>
            {uniqueSpecialties.map((spec) => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>

          {/* Priority selection */}
          <select
            className="rounded-xl border border-slate-800 bg-[#111B35] py-2.5 px-4 text-xs text-slate-400 focus:border-indigo-500 focus:outline-none"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="High">High Detailing Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>

        {/* Add trigger */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="shrink-0 flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white px-4 py-3 shadow-lg shadow-indigo-600/10 transition-colors focus:outline-none"
        >
          <UserPlus className="h-4.5 w-4.5" />
          Register Clinician
        </button>

      </div>

      {/* Clinicians Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-48 rounded-2xl bg-slate-900 border border-slate-800" />
          ))}
        </div>
      ) : filteredHcps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredHcps.map((doc) => (
            <div 
              key={doc.id} 
              className={`glass-panel rounded-2xl p-6 relative overflow-hidden transition-all hover:scale-[1.01] border-l-4 ${
                doc.priority === 'High' 
                  ? 'border-l-amber-500' 
                  : doc.priority === 'Medium'
                  ? 'border-l-indigo-500'
                  : 'border-l-slate-600'
              }`}
            >
              
              {/* Card Header */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h4 className="text-base font-bold text-white tracking-tight">{doc.name}</h4>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-indigo-400 font-semibold">
                    <Stethoscope className="h-3.5 w-3.5 shrink-0" />
                    <span>{doc.specialty}</span>
                  </div>
                </div>
                
                {/* Priority status badge */}
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  doc.priority === 'High' 
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                    : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                }`}>
                  {doc.priority}
                </span>
              </div>

              {/* Hospital Location */}
              <div className="mt-4 flex items-start gap-2 text-xs text-slate-300 font-medium">
                <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                <span>{doc.hospital}, {doc.city}</span>
              </div>

              {/* Contact Details */}
              <div className="mt-4 pt-4 border-t border-slate-800/60 space-y-2 text-[11px] font-normal text-slate-400">
                {doc.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate hover:text-white transition-colors">{doc.email}</span>
                  </div>
                )}
                {doc.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>{doc.phone}</span>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-500 text-xs">
          No healthcare professionals found matching your filters.
        </div>
      )}

      {/* --- Register HCP Modal --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050814]/80 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#0B1329] p-8 shadow-2xl">
            
            <h3 className="text-lg font-bold text-white tracking-tight mb-6">Register Healthcare Professional</h3>
            
            {newError && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-400">
                {newError}
              </div>
            )}

            <form onSubmit={handleAddHcp} className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Doctor Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Amit Sharma"
                  className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-2.5 px-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Specialty</label>
                  <select
                    className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-2.5 px-4 text-xs text-slate-400 focus:outline-none focus:border-indigo-500"
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="Oncology">Oncology</option>
                    <option value="Nephrology">Nephrology</option>
                    <option value="General Practice">General Practice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Detailing Priority</label>
                  <select
                    className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-2.5 px-4 text-xs text-slate-400 focus:outline-none focus:border-indigo-500"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                  >
                    <option value="High">High Target</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Hospital / Clinic</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apollo Hospital"
                  className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-2.5 px-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  value={newHospital}
                  onChange={(e) => setNewHospital(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">City</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai"
                  className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-2.5 px-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="dr@hospital.com"
                    className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-2.5 px-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="555-0100"
                    className="w-full rounded-xl border border-slate-800 bg-[#111B35] py-2.5 px-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>

              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={newSubmitting}
                  className="grow rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2.5 text-xs font-bold text-white transition-colors disabled:bg-indigo-600/40"
                >
                  {newSubmitting ? 'Registering...' : 'Save target Doctor'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
