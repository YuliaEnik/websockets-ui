import { Ship, CellState } from '../types/index.js';

export const validateShips = (ships: Ship[]): boolean => {
  const shipTypes = {
    huge: { count: 1, length: 4 },
    large: { count: 2, length: 3 },
    medium: { count: 3, length: 2 },
    small: { count: 4, length: 1 }
  };

  const counts = { huge: 0, large: 0, medium: 0, small: 0 };
  
  ships.forEach(ship => {
    counts[ship.type]++;
    
    if (ship.length !== shipTypes[ship.type].length) {
      return false;
    }
  });

  if (counts.huge !== shipTypes.huge.count || 
      counts.large !== shipTypes.large.count ||
      counts.medium !== shipTypes.medium.count || 
      counts.small !== shipTypes.small.count) {
    return false;
  }

  const board = createEmptyBoard();
  
  for (const ship of ships) {
    const { position, direction, length } = ship;
    const { x, y } = position;
    
    if (ship.direction) {
      if (x + ship.length > 10) return false;
    } else {
      if (y + ship.length > 10) return false;
    }

    if (!canPlaceShip(board, ship)) {
      return false;
    }

    placeShipForValidation(board, ship);
  }

  return true;
};

function createEmptyBoard(): number[][] {
  return Array(10).fill(null).map(() => Array(10).fill(0));
}

function canPlaceShip(board: number[][], ship: Ship): boolean {
 const { position, direction, length } = ship;
  const { x, y } = position; 
  
  for (let i = -1; i <= length; i++) {
    for (let j = -1; j <= 1; j++) {
      const checkX = direction ? x + i : x + j;
      const checkY = direction ? y + j : y + i;
      
      if (checkX >= 0 && checkX < 10 && checkY >= 0 && checkY < 10) {
        if (i >= 0 && i < length && j === 0) {
          if (board[checkY][checkX] === 1) {
            return false;
          }
        } else {
          if (board[checkY][checkX] === 1) {
            return false;
          }
        }
      }
    }
  }
  return true;
}

function placeShipForValidation(board: number[][], ship: Ship): void {
  const { position, direction, length } = ship;
  const { x, y } = position;
  
  for (let i = 0; i < length; i++) {
    const placeX = direction ? x + i : x;
    const placeY = direction ? y : y + i;
    board[placeY][placeX] = 1;
  }
}
