import { combineReducers, configureStore } from '@reduxjs/toolkit'
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
  type Storage,
} from 'redux-persist'
import storageImport from 'redux-persist/lib/storage'
import uiReducer from './slices/ui.slice'

/**
 * Vite's CJS prebundle for `redux-persist/lib/storage` may expose the engine
 * as either the default export itself or as `{ default: engine }`. Resolve by
 * runtime shape so persistReducer always receives a valid Storage.
 */
function resolvePersistStorage(candidate: unknown): Storage {
  if (isPersistStorage(candidate)) {
    return candidate
  }

  if (
    candidate !== null &&
    typeof candidate === 'object' &&
    'default' in candidate &&
    isPersistStorage(candidate.default)
  ) {
    return candidate.default
  }

  throw new Error(
    'redux-persist local storage engine could not be resolved at runtime',
  )
}

function isPersistStorage(value: unknown): value is Storage {
  if (value === null || typeof value !== 'object') {
    return false
  }

  const engine = value as Partial<Storage>
  return (
    typeof engine.getItem === 'function' &&
    typeof engine.setItem === 'function' &&
    typeof engine.removeItem === 'function'
  )
}

const storage = resolvePersistStorage(storageImport)

const uiPersistConfig = {
  key: 'ui',
  storage,
  // Mobile drawer open state is temporary — nothing to persist for now.
  whitelist: [],
}

const rootReducer = combineReducers({
  ui: persistReducer(uiPersistConfig, uiReducer),
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
