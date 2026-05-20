import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  list: [],
  selectedHcp: null,
  loading: false,
  error: null,
}

const hcpSlice = createSlice({
  name: 'hcps',
  initialState,
  reducers: {
    hcpStart: (state) => {
      state.loading = true
      state.error = null
    },
    hcpFetchSuccess: (state, action) => {
      state.loading = false
      state.list = action.payload
    },
    hcpFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
    selectHcp: (state, action) => {
      state.selectedHcp = action.payload
    },
    addHcpSuccess: (state, action) => {
      state.list.unshift(action.payload)
      state.loading = false
    }
  }
})

export const { hcpStart, hcpFetchSuccess, hcpFailure, selectHcp, addHcpSuccess } = hcpSlice.actions
export default hcpSlice.reducer
