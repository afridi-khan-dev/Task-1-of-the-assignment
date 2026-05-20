import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  list: [],
  activeInteraction: null,
  loading: false,
  error: null,
}

const interactionSlice = createSlice({
  name: 'interactions',
  initialState,
  reducers: {
    interactionStart: (state) => {
      state.loading = true
      state.error = null
    },
    interactionFetchSuccess: (state, action) => {
      state.loading = false
      state.list = action.payload
    },
    interactionLogSuccess: (state, action) => {
      state.loading = false
      state.list.unshift(action.payload)
    },
    interactionEditSuccess: (state, action) => {
      state.loading = false
      const idx = state.list.findIndex(item => item.id === action.payload.interaction_id)
      if (idx !== -1) {
        state.list[idx] = {
          ...state.list[idx],
          summary: action.payload.summary,
          sentiment: action.payload.sentiment,
          products_discussed: action.payload.products_discussed,
          follow_up_date: action.payload.follow_up_date
        }
      }
    },
    interactionFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
    setActiveInteraction: (state, action) => {
      state.activeInteraction = action.payload
    }
  }
})

export const { 
  interactionStart, 
  interactionFetchSuccess, 
  interactionLogSuccess, 
  interactionEditSuccess, 
  interactionFailure,
  setActiveInteraction
} = interactionSlice.actions
export default interactionSlice.reducer
