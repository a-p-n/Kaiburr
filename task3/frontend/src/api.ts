import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

export interface TaskExecution {
  startTime: Date;
  endTime?: Date | null;
  output?: string | null;
}

export interface Task {
  id: string;
  name: string;
  owner: string;
  command: string;
  taskExecutions?: TaskExecution[] | null;
}

export const getTasks = () => {
  return axios.get<Task[]>(`${API_BASE_URL}/tasks`);
};

export const createTask = (taskData: Omit<Task, 'id' | 'taskExecutions'>) => {
  return axios.put<Task>(`${API_BASE_URL}/tasks`, taskData);
};

export const deleteTask = (id: string) => {
  return axios.delete(`${API_BASE_URL}/tasks/${id}`);
};

export const executeTask = (id: string) => {
  return axios.put<Task>(`${API_BASE_URL}/tasks/${id}/execute`);
};