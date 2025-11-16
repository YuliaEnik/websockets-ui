import { RoomData, RoomUser } from '../types/index.js';
import { generateId } from '../utils/helpers.js';

const rooms = new Map<string, RoomData>();

export const createRoom = (user: RoomUser): string => {
  const roomId = generateId();
  const newRoom: RoomData = {
    roomId,
    roomUsers: [user]
  };

  rooms.set(roomId, newRoom);
  return roomId;
};

export const addUserToRoom = (roomId: string, user: RoomUser): boolean => {
  const room = rooms.get(roomId);
  if (room && room.roomUsers.length === 1) {
    room.roomUsers.push(user);
    return true;
  }
  return false;
};

export const removeUserFromRoom = (roomId: string, userIndex: string): void => {
  const room = rooms.get(roomId);
  if (room) {
    room.roomUsers = room.roomUsers.filter(user => user.index !== userIndex);
    if (room.roomUsers.length === 0) {
      rooms.delete(roomId);
    }
  }
};

export const removeUserFromAllRooms = (userIndex: string): string | null => {
  let removedRoomId: string | null = null;
  
  for (const [roomId, room] of rooms.entries()) {
    const userInRoom = room.roomUsers.find(user => user.index === userIndex);
    if (userInRoom) {
      room.roomUsers = room.roomUsers.filter(user => user.index !== userIndex);
      if (room.roomUsers.length === 0) {
        rooms.delete(roomId);
      }
      removedRoomId = roomId;
      break;
    }
  }
  
  return removedRoomId;
};

export const getAvailableRooms = (): RoomData[] => {
  return Array.from(rooms.values())
    .filter(room => room.roomUsers.length === 1)
    .map(room => ({
      roomId: room.roomId,
      roomUsers: [...room.roomUsers]
    }));
};

export const getRoom = (roomId: string): RoomData | undefined => {
  return rooms.get(roomId);
};

export const deleteRoom = (roomId: string): void => {
  rooms.delete(roomId);
};
