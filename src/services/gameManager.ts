import { Game, Ship, GameShip, CellState } from '../types/index.js';
import { generateId } from '../utils/helpers.js';

const games = new Map<string, Game>();

export const createNewGame = (players: string[]): string => {
  const gameId = generateId();
  const game: Game = {
    gameId,
    players,
    ships: new Map(),
    boards: new Map(),
    currentPlayer: players[0],
    status: 'placing'
  };

  players.forEach(playerId => {
    game.boards.set(playerId, createEmptyBoard());
  });

  games.set(gameId, game);
  return gameId;
};

export const addShipsToGame = (gameId: string, playerId: string, ships: Ship[]): boolean => {
  const game = games.get(gameId);
  if (!game) return false;

  const gameShips: GameShip[] = ships.map(ship => ({
    ...ship,
    hits: 0,
    sunk: false
  }));

  game.ships.set(playerId, gameShips);
  
  const board = game.boards.get(playerId);
  if (board) {
    placeShipsOnBoard(board, ships);
  }

  if (game.ships.size === 2) {
    game.status = 'playing';
    return true; 
  }

  return false;
};

export const getGame = (gameId: string): Game | undefined => {
  return games.get(gameId);
};

export const isGameReadyToStart = (gameId: string): boolean => {
  const game = games.get(gameId);
  return game?.ships.size === 2;
};

export const getPlayerShips = (gameId: string, playerId: string): Ship[] | undefined => {
  const game = games.get(gameId);
  const gameShips = game?.ships.get(playerId);
  return gameShips?.map(ship => ({
    position: ship.position,
    direction: ship.direction,
    length: ship.length,
    type: ship.type
  }));
};

function createEmptyBoard(): CellState[][] {
  const board: CellState[][] = [];
  for (let i = 0; i < 10; i++) {
    board.push(Array(10).fill(CellState.Empty));
  }
  return board;
}

function placeShipsOnBoard(board: CellState[][], ships: Ship[]): void {
  ships.forEach(ship => {
    const { x, y } = ship.position;
    
    for (let i = 0; i < ship.length; i++) {
      if (ship.direction) {
        board[y][x + i] = CellState.Ship;
      } else {
        board[y + i][x] = CellState.Ship;
      }
    }
  });
}
