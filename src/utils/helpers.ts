import type { WebSocketMessage, RegistrationResponse } from '../types/index.js';

export const createWebSocketMessage = (type: string, data: unknown): WebSocketMessage => {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  
  return {
    type,
    data: dataString, 
    id: 0
  };
};

export const createRegistrationResponse = (
  name: string, 
  index: string, 
  error: boolean = false, 
  errorText: string = ''
): RegistrationResponse => ({
  name,
  index,
  error,
  errorText
});

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};
