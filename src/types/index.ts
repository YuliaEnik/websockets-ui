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

export interface ShipPosition {
  x: number;
  y: number;
}

export interface Ship {
  position: ShipPosition;
  direction: boolean;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
}

export interface GameShip extends Ship {
  hits: number;
  sunk: boolean;
}

export interface AddShipsData {
  gameId: string;
  ships: Ship[];
  indexPlayer: string;
}

export interface StartGameData {
  ships: Ship[];
  currentPlayerIndex: string;
}

export interface Game {
  gameId: string;
  players: string[];
  ships: Map<string, GameShip[]>;
  boards: Map<string, CellState[][]>;
  currentPlayer: string;
  status: 'waiting' | 'placing' | 'playing' | 'finished';
}

export enum CellState {
  Empty = 'empty',
  Ship = 'ship',
  Miss = 'miss',
  Shot = 'shot',
  Killed = 'killed'
}
export interface AttackData {
  gameId: string;
  x: number;
  y: number;
  indexPlayer: string;
}
export interface RandomAttackData {
  gameId: string;
  indexPlayer: string;
}

export interface AttackResult {
  position: {
    x: number;
    y: number;
  };
  currentPlayer: string;
  status: 'miss' | 'killed' | 'shot';
}

export interface TurnData {
  currentPlayer: string;
}

export interface FinishData {
  winPlayer: string;
}
