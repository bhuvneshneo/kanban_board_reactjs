// src/slices/tasksSlice.js
import { createSlice, nanoid } from "@reduxjs/toolkit";

const initialState = { tasks: [] };

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
      addTask(state, action) {
      const { name, priority, deadline, userId } = action.payload;

      const newTask = {
        id: nanoid(),
        name,
        priority,
        deadline,
        stage: 0,
        userId: userId || null,
      };

      state.tasks.push(newTask);
    },

    updateTask(state, action) {
      const { id, updates } = action.payload;
      const existingTask = state.tasks.find((task) => task.id === id);
      if (existingTask) {
        Object.assign(existingTask, updates);
      }
    },

    deleteTask(state, action) {
      const taskId = action.payload;
      state.tasks = state.tasks.filter((task) => task.id !== taskId);
    },

    moveBack(state, action) {
      const taskId = action.payload;
      const task = state.tasks.find((task) => task.id === taskId);
      if (task && task.stage > 0) {
        task.stage -= 1;
      }
    },

    moveForward(state, action) {
      const taskId = action.payload;
      const task = state.tasks.find((task) => task.id === taskId);
      if (task && task.stage < 3) {
        task.stage += 1;
      }
    },

    moveToStage(state, action) {
      const { id, stage } = action.payload;
      const task = state.tasks.find((task) => task.id === id);
      if (task) {
        task.stage = stage;
      }
    },
  },
});

export const {
  addTask,
  updateTask,
  deleteTask,
  moveBack,
  moveForward,
  moveToStage,
} = tasksSlice.actions;

export default tasksSlice.reducer;
