import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  token: localStorage.getItem('token') || null,
  username: localStorage.getItem('username') || null,
  role: localStorage.getItem('role') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStart: (state) => {
      state.loading = true
      state.error = null
    },
    authSuccess: (state, action) => {
      const { access_token, username, role } = action.payload
      state.loading = false
      state.token = access_token
      state.username = username
      state.role = role
      state.isAuthenticated = true
      state.error = null
      
      // Save session context
      localStorage.setItem('token', access_token)
      localStorage.setItem('username', username)
      localStorage.setItem('role', role)
    },
    authFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
      state.isAuthenticated = false
    },
    logout: (state) => {
      state.token = null
      state.username = null
      state.role = null
      state.isAuthenticated = false
      state.loading = false
      state.error = null
      
      // Flush storage
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      localStorage.removeItem('role')
    },
    clearAuthError: (state) => {
      state.error = null
    }
  }
})

export const { authStart, authSuccess, authFailure, logout, clearAuthError } = authSlice.actions
export default authSlice.reducer
