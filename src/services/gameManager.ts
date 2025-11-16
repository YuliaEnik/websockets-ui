import { Game, Ship, GameShip, CellState, AttackResult } from '../types/index.js';
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

export const processAttack = (gameId: string, playerId: string, x: number, y: number): AttackResult | null => {
  const game = games.get(gameId);
  if (!game || game.status !== 'playing') return null;

  if (playerId !== game.currentPlayer) {
    console.log(`Not player ${playerId}'s turn. Current player: ${game.currentPlayer}`);
    return null;
  }

  const enemyId = game.players.find(id => id !== playerId);
  if (!enemyId) return null;

  const enemyBoard = game.boards.get(enemyId);
  const enemyShips = game.ships.get(enemyId);
  
  if (!enemyBoard || !enemyShips) return null;

  if (x < 0 || x >= 10 || y < 0 || y >= 10) {
    return null;
  }

  const cellState = enemyBoard[y][x];
  let status: 'miss' | 'killed' | 'shot' = 'miss';

  if (cellState === CellState.Miss || cellState === CellState.Shot || cellState === CellState.Killed) {
    return null;
  }

  if (cellState === CellState.Ship) {
    enemyBoard[y][x] = CellState.Shot;
    
    const hitShip = enemyShips.find(ship => isShipHit(ship, x, y));
    
    if (hitShip) {
      hitShip.hits++;
      if (hitShip.hits === hitShip.length) {
        hitShip.sunk = true;
        markAroundShip(hitShip, enemyBoard);
        status = 'killed';
      } else {
        status = 'shot';
      }
    }
 
    console.log(`Hit! Player ${playerId} continues turn`);
    
  } else if (cellState === CellState.Empty) {

    enemyBoard[y][x] = CellState.Miss;
    status = 'miss';
    switchTurn(game);
    console.log(`Miss! Switching turn to next player`);
  }

  const result: AttackResult = {
    position: { x, y },
    currentPlayer: game.currentPlayer,
    status
  };

  return result;
};

export const generateRandomAttack = (gameId: string, playerId: string): { x: number; y: number } | null => {
  const game = games.get(gameId);
  if (!game || game.status !== 'playing') return null;

  if (playerId !== game.currentPlayer) return null;

  const enemyId = game.players.find(id => id !== playerId);
  if (!enemyId) return null;

  const enemyBoard = game.boards.get(enemyId);
  if (!enemyBoard) return null;

  const availableCells: { x: number; y: number }[] = [];
  
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      if (enemyBoard[y][x] === CellState.Empty || enemyBoard[y][x] === CellState.Ship) {
        availableCells.push({ x, y });
      }
    }
  }

  if (availableCells.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * availableCells.length);
  return availableCells[randomIndex];
};

export const checkGameFinished = (gameId: string): string | null => {
  const game = games.get(gameId);
  if (!game) return null;

  for (const [playerId, ships] of game.ships) {
    const allSunk = ships.every(ship => ship.sunk);
    if (allSunk) {
      game.status = 'finished';
      const winnerId = game.players.find(id => id !== playerId);
      return winnerId || null;
    }
  }
  
  return null;
};

export const getCurrentPlayer = (gameId: string): string | undefined => {
  return games.get(gameId)?.currentPlayer;
};

function isShipHit(ship: GameShip, x: number, y: number): boolean {
  const { position, direction, length } = ship;
  const shipX = position.x;
  const shipY = position.y;

  if (direction) {
    return y === shipY && x >= shipX && x < shipX + length;
  } else {
    return x === shipX && y >= shipY && y < shipY + length;
  }
}

function markAroundShip(ship: GameShip, board: CellState[][]): void {
  const { position, direction, length } = ship;
  const startX = Math.max(0, position.x - 1);
  const endX = Math.min(9, position.x + (direction ? length : 1));
  const startY = Math.max(0, position.y - 1);
  const endY = Math.min(9, position.y + (direction ? 1 : length));

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      if (board[y][x] === CellState.Empty) {
        board[y][x] = CellState.Miss;
      }
    }
  }
}

function switchTurn(game: Game): void {
  const currentIndex = game.players.indexOf(game.currentPlayer);
  const nextIndex = (currentIndex + 1) % game.players.length;
  game.currentPlayer = game.players[nextIndex];
  console.log(`Turn switched to player: ${game.currentPlayer}`);
}
