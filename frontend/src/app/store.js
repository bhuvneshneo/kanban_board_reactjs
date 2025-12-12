// src/store.js (redux-persist version)
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage"; // localStorage
import tasksReducer from "./slices/tasksSlice";
import { combineReducers } from "redux";

const rootReducer = combineReducers({ tasks: tasksReducer });

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["tasks"], // only persist tasks slice
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // redux-persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export default store;
