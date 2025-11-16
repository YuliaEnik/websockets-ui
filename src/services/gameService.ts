import { generateId } from '../utils/helpers.js';

export const createGame = (players: string[]): { idGame: string; idPlayer: string }[] => {
  const gameId = generateId();
  
  console.log(`Creating game ${gameId} for players:`, players);
 
  return players.map(playerId => ({
    idGame: gameId, 
    idPlayer: playerId
  }));
};
