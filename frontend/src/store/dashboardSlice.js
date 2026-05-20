import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  metrics: {
    total_interactions: 0,
    total_hcps: 0,
    pending_followups: 0,
    compliance_score: 100.0,
    high_priority_hcps: [],
    upcoming_followups: [],
    engagement_trends: [],
    specialty_distribution: {},
    ai_insights: []
  },
  loading: false,
  error: null,
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    dashboardStart: (state) => {
      state.loading = true
      state.error = null
    },
    dashboardSuccess: (state, action) => {
      state.loading = false
      state.metrics = action.payload
    },
    dashboardFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    }
  }
})

export const { dashboardStart, dashboardSuccess, dashboardFailure } = dashboardSlice.actions
export default dashboardSlice.reducer
