import { WebSocketServer, WebSocket } from 'ws';
import  { httpServer }  from './http_server/index.js';
import { createWebSocketMessage, createRegistrationResponse, generateId } from './utils/helpers.js';
import { 
  registerPlayer, 
  findPlayerByWebSocket, 
  removePlayer, 
  getWinners,
  getPlayer,
  getAllPlayers 
} from './services/playerService.js';
import { 
  createRoom, 
  addUserToRoom, 
  removeUserFromAllRooms, 
  getAvailableRooms, 
  deleteRoom, 
  getRoom 
} from './services/roomService.js';
import { createGame } from './services/gameService.js';
import type { WebSocketMessage, PlayerData, AddUserToRoomData } from './types/index.js';

const HTTP_PORT = 8181;
const WS_PORT = 3000;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const wss = new WebSocketServer({ port: WS_PORT });
console.log(`WebSocket server started on port ${WS_PORT}`);

function broadcastRoomUpdate(): void {
  const availableRooms = getAvailableRooms();
  const message = createWebSocketMessage('update_room', availableRooms);

  broadcastToAllPlayers(message);
  console.log('Broadcast room update:', availableRooms);
}

function broadcastWinnersUpdate(): void {
  const winnersData = getWinners();
  const message = createWebSocketMessage('update_winners', winnersData);
  
  broadcastToAllPlayers(message);
  console.log('Broadcast winners update:', winnersData);
}

function broadcastToAllPlayers(message: WebSocketMessage): void {
  const allPlayers = getAllPlayers();
  allPlayers.forEach(player => {
    if (player.ws.readyState === player.ws.OPEN) {
      player.ws.send(JSON.stringify(message));
    }
  });
  console.log('Broadcasting to all players:', message);
}

function handleCreateRoom(ws: WebSocket): void {
  const player = findPlayerByWebSocket(ws);
  if (!player) return;
  
  removeUserFromAllRooms(player.index);

  const roomId = createRoom({
    name: player.name,
    index: player.index
  });

  console.log(`Room ${roomId} created by player ${player.name}`);
  broadcastRoomUpdate();
}

function handleAddUserToRoom(ws: WebSocket, data: AddUserToRoomData): void {
  const player = findPlayerByWebSocket(ws);
  if (!player) return;

  const room = getRoom(data.indexRoom);
  if (!room || room.roomUsers.length !== 1) return;

  removeUserFromAllRooms(player.index);

  const success = addUserToRoom(data.indexRoom, {
    name: player.name,
    index: player.index
  });

  if (success) {
    console.log(`Player ${player.name} joined room ${data.indexRoom}`);

    const playersIds = room.roomUsers.map(user => user.index);

    room.roomUsers.forEach((user) => {
      const playerData = getPlayer(user.index);
      if (playerData && playerData.ws.readyState === playerData.ws.OPEN) {
        const gameData = createGame(playersIds);
        const response = createWebSocketMessage('create_game', {
          idGame: gameData.idGame,
          idPlayer: user.index
        });
        sendMessage(playerData.ws, response);
        console.log('Sent create_game to player:', user.name);
      }
    });

    deleteRoom(data.indexRoom);
    broadcastRoomUpdate();
  }
}

function handleRegistration(ws: WebSocket, data: PlayerData): void {
  const { name, password } = data;
  const result = registerPlayer({ name, password }, ws);
  
  const response = createWebSocketMessage('reg', 
    createRegistrationResponse(
      result.player.name, 
      result.player.index, 
      result.error, 
      result.errorText
    )
  );
  
  sendMessage(ws, response);
  
  if (!result.error) {
    console.log(result.player.index ? 'Player reconnected:' : 'New player registered:', name);
    
    setTimeout(() => {
      broadcastRoomUpdate();
      broadcastWinnersUpdate();
    }, 100);
  } else {
    console.log('Registration error for player:', name, result.errorText);
  }
}

function sendMessage(ws: WebSocket, message: WebSocketMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
    console.log('Sent message:', message);
  }
}

function handleDisconnection(ws: WebSocket): void {
  const player = findPlayerByWebSocket(ws);
  if (player) {
    removeUserFromAllRooms(player.index);
    removePlayer(player.index);
    console.log(`Player ${player.name} removed`);
    broadcastRoomUpdate();
  }
}

function handleMessage(ws: WebSocket, data: Buffer): void {
  try {
    const message: WebSocketMessage = JSON.parse(data.toString());
    console.log('Received message:', message);
    
    switch (message.type) {
      case 'reg':
        handleRegistration(ws, message.data as PlayerData);
        break;
      case 'create_room':
        handleCreateRoom(ws);
        break;
      case 'add_user_to_oom':
        handleAddUserToRoom(ws, message.data as AddUserToRoomData);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  } catch (error) {
    console.error('Error parsing message:', error);
  }
}

wss.on('connection', (ws: WebSocket) => {
  console.log('New client connected');

  ws.on('message', (data: Buffer) => {
    handleMessage(ws, data);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    handleDisconnection(ws);
  });

  ws.on('error', (error: Error) => {
    console.error('WebSocket error:', error);
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  wss.close(() => {
    console.log('WebSocket server closed');
  });
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
