import { CreateGameData } from '../types/index.js';
import { generateId } from '../utils/helpers.js';

export const createGame = (players: string[]): CreateGameData => {
  const gameId = generateId();
  
  return {
    idGame: gameId,
    idPlayer: players[0] 
  };
};
