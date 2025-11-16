import { WebSocket } from 'ws';

export interface WebSocketMessage {
  type: string;
  data: unknown;
  id: 0;
}

export interface PlayerData {
  name: string;
  password: string;
}

export interface RegistrationResponse {
  name: string;
  index: string;
  error: boolean;
  errorText: string;
}

export interface RoomUser {
  name: string;
  index: string;
}

export interface RoomData {
  roomId: string;
  roomUsers: RoomUser[];
}

export interface AddUserToRoomData {
  indexRoom: string;
}

export interface Winner {
  name: string;
  wins: number;
}

export interface Player {
  name: string;
  password: string;
  index: string;
  ws: WebSocket;
  wins: number;
}

export interface CreateGameData {
  idGame: string;
  idPlayer: string;
}
