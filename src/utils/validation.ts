import { Ship } from '../types/index.js';

export const validateShips = (ships: Ship[]): boolean => {
  console.log('VALIDATE SHIPS START');
  
  const shipTypes = {
    huge: { count: 1, length: 4 },
    large: { count: 2, length: 3 },
    medium: { count: 3, length: 2 },
    small: { count: 4, length: 1 }
  };

  const counts = { huge: 0, large: 0, medium: 0, small: 0 };
  
  for (const ship of ships) {
    counts[ship.type]++;
    
    if (ship.length !== shipTypes[ship.type].length) {
      console.log(`FAIL: Ship type ${ship.type} has wrong length ${ship.length}, expected ${shipTypes[ship.type].length}`);
      return false;
    }
  }

  console.log('Ship counts:', counts);
  console.log('Expected counts:', shipTypes);

  if (counts.huge !== shipTypes.huge.count) {
    console.log(`FAIL: Huge ships count ${counts.huge}, expected ${shipTypes.huge.count}`);
    return false;
  }
  if (counts.large !== shipTypes.large.count) {
    console.log(`FAIL: Large ships count ${counts.large}, expected ${shipTypes.large.count}`);
    return false;
  }
  if (counts.medium !== shipTypes.medium.count) {
    console.log(`FAIL: Medium ships count ${counts.medium}, expected ${shipTypes.medium.count}`);
    return false;
  }
  if (counts.small !== shipTypes.small.count) {
    console.log(`FAIL: Small ships count ${counts.small}, expected ${shipTypes.small.count}`);
    return false;
  }

  const board = createEmptyBoard();
  
  for (const ship of ships) {
    const { position, direction, length } = ship;
    const { x, y } = position;
    
    console.log(`Checking ship at (${x},${y}), direction: ${direction}, length: ${length}, type: ${ship.type}`);

    if (direction) {
      if (x + length > 10) {
        console.log(`FAIL: Ship goes beyond right border: x=${x}, length=${length}`);
        return false;
      }
    } else {
      if (y + length > 10) {
        console.log(`FAIL: Ship goes beyond bottom border: y=${y}, length=${length}`);
        return false;
      }
    }

    if (!canPlaceShip(board, ship)) {
      console.log(`FAIL: Cannot place ship at (${x},${y}) - overlaps or adjacent to another ship`);
      return false;
    }

    placeShipForValidation(board, ship);
    console.log(`Placed ship at (${x},${y})`);
  }

  console.log('=== VALIDATE SHIPS SUCCESS ===');
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
