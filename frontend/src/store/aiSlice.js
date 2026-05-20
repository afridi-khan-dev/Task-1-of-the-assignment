import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  messages: [
    {
      id: "init",
      role: "assistant",
      content: "Hello! I am your AI CRM Detailing Assistant. You can log interactions naturally. Try typing:\n\n*\"I met Dr Jenkins at Mayo Clinic today and we discussed Cardiox titration benefits.\"*"
    }
  ],
  lastLoggedInteraction: null,
  complianceAlerts: null,
  recommendation: null,
  loading: false,
  error: null,
}

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    aiStart: (state) => {
      state.loading = true
      state.error = null
    },
    aiSuccess: (state, action) => {
      state.loading = false
      const { response_type, content, extracted_entities, compliance_status, follow_up_recommendation, sentiment, interaction_id, hcp_details } = action.payload
      
      state.messages.push({
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: content,
        response_type,
        sentiment
      })
      
      if (response_type === "logged_interaction") {
        state.lastLoggedInteraction = {
          interaction_id,
          hcp_details,
          extracted_entities,
          sentiment
        }
      }
      
      state.complianceAlerts = compliance_status
      state.recommendation = follow_up_recommendation
    },
    aiFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
      state.messages.push({
        id: `msg-err-${Date.now()}`,
        role: "assistant",
        content: `Sorry, I encountered an orchestrator failure: ${action.payload}`
      })
    },
    addMessage: (state, action) => {
      state.messages.push({
        id: `msg-user-${Date.now()}`,
        role: "user",
        content: action.payload
      })
    },
    clearAiState: (state) => {
      state.lastLoggedInteraction = null
      state.complianceAlerts = null
      state.recommendation = null
    }
  }
})

export const { aiStart, aiSuccess, aiFailure, addMessage, clearAiState } = aiSlice.actions
export default aiSlice.reducer
