import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type UiState = {
  mobileSidebarOpen: boolean
}

const initialState: UiState = {
  mobileSidebarOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setMobileSidebarOpen(state, action: PayloadAction<boolean>) {
      state.mobileSidebarOpen = action.payload
    },
    toggleMobileSidebar(state) {
      state.mobileSidebarOpen = !state.mobileSidebarOpen
    },
  },
})

export const { setMobileSidebarOpen, toggleMobileSidebar } = uiSlice.actions

export default uiSlice.reducer
