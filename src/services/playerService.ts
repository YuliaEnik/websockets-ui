import { WebSocket } from 'ws';
import { Player, PlayerData, Winner } from '../types/index.js';
import { generateId } from '../utils/helpers.js';

const players = new Map<string, Player>();

export const registerPlayer = (data: PlayerData, ws: WebSocket): { player: Player; error: boolean; errorText: string } => {
  for (const player of players.values()) {
    if (player.name === data.name) {
      if (player.password === data.password) {
        player.ws = ws;
        return { 
          player, 
          error: false, 
          errorText: '' 
        };
      } else {
        return { 
          player: { name: '', password: '', index: '', ws, wins: 0 }, 
          error: true, 
          errorText: 'Invalid password' 
        };
      }
    }
  }

  const newPlayer: Player = {
    name: data.name,
    password: data.password,
    index: generateId(),
    ws,
    wins: 0
  };

  players.set(newPlayer.index, newPlayer);
  
  return { 
    player: newPlayer, 
    error: false, 
    errorText: '' 
  };
};

export const getPlayer = (index: string): Player | undefined => {
  return players.get(index);
};

export const updatePlayerWins = (playerIndex: string): void => {
  const player = players.get(playerIndex);
  if (player) {
    player.wins++;
  }
};

export const getWinners = (): Winner[] => {
  return Array.from(players.values())
    .map(player => ({ name: player.name, wins: player.wins }))
    .sort((a, b) => b.wins - a.wins);
};

export const removePlayer = (playerIndex: string): void => {
  players.delete(playerIndex);
};

export const findPlayerByWebSocket = (ws: WebSocket): Player | undefined => {
  for (const player of players.values()) {
    if (player.ws === ws) {
      return player;
    }
  }
  return undefined;
};

export const getAllPlayers = (): Player[] => {
  return Array.from(players.values());
};
