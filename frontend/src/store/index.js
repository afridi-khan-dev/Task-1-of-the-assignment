import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import hcpReducer from './hcpSlice'
import interactionReducer from './interactionSlice'
import dashboardReducer from './dashboardSlice'
import aiReducer from './aiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    hcps: hcpReducer,
    interactions: interactionReducer,
    dashboard: dashboardReducer,
    ai: aiReducer,
  },
})

export default store
