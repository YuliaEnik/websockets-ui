import { CreateGameData } from '../types/index.js';
import { generateId } from '../utils/helpers.js';
import { createNewGame } from './gameManager.js';

export const createGame = (players: string[]): CreateGameData => {
  const gameId = createNewGame(players);
  
  return {
    idGame: gameId,
    idPlayer: players[0] 
  };
};
