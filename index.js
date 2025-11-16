import { WebSocketServer } from 'ws';
import { httpServer } from './src/http_server/index.js';
import { createWebSocketMessage, createRegistrationResponse } from './src/types.js';

const HTTP_PORT = 8181;
const WS_PORT = 3000;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const wss = new WebSocketServer({ port: WS_PORT });
console.log(`WebSocket server started on port ${WS_PORT}`);

const players = new Map();
const rooms = new Map();
const winners = [];

function broadcastRoomUpdate() {
    const availableRooms = Array.from(rooms.values())
        .filter(room => room.roomUsers.length === 1)
        .map(room => ({
            roomId: room.roomId,
            roomUsers: room.roomUsers
        }));

    const message = createWebSocketMessage('update_room', availableRooms);
    
    players.forEach(player => {
        if (player.ws.readyState === player.ws.OPEN) {
            player.ws.send(JSON.stringify(message));
        }
    });
    console.log('Broadcast room update:', availableRooms);
}

function broadcastWinnersUpdate() {
    const winnersData = winners.map(winner => ({
        name: winner.name,
        wins: winner.wins
    }));

    const message = createWebSocketMessage('update_winners', winnersData);
    
    players.forEach(player => {
        if (player.ws.readyState === player.ws.OPEN) {
            player.ws.send(JSON.stringify(message));
        }
    });
    console.log('Broadcast winners update:', winnersData);
}

function handleCreateRoom(ws) {
    const player = findPlayerByWebSocket(ws);
    if (!player) return;
    removePlayerFromAllRooms(player.index);

    const roomId = generateId();
    const newRoom = {
        roomId,
        roomUsers: [{
            name: player.name,
            index: player.index
        }]
    };

    rooms.set(roomId, newRoom);
    console.log(`Room ${roomId} created by player ${player.name}`);

    broadcastRoomUpdate();
}

function handleAddUserToRoom(ws, data) {
    const player = findPlayerByWebSocket(ws);
    if (!player) return;

    const room = rooms.get(data.indexRoom);
    if (!room || room.roomUsers.length !== 1) return;

    removePlayerFromAllRooms(player.index);

    room.roomUsers.push({
        name: player.name,
        index: player.index
    });

    console.log(`Player ${player.name} joined room ${data.indexRoom}`);

    room.roomUsers.forEach((user, index) => {
        const playerData = players.get(user.index);
        if (playerData && playerData.ws.readyState === playerData.ws.OPEN) {
            const response = createWebSocketMessage('create_game', {
                idGame: generateId(),
                idPlayer: user.index
            });
            playerData.ws.send(JSON.stringify(response));
            console.log('Sent create_game to player:', user.name);
        }
    });

    rooms.delete(data.indexRoom);

    broadcastRoomUpdate();
}

function handleRegistration(ws, data) {
    const { name, password } = data;

    let playerExists = false;
    for (const player of players.values()) {
        if (player.name === name) {
            playerExists = true;
            if (player.password === password) {
                player.ws = ws;
                const response = createWebSocketMessage('reg', 
                    createRegistrationResponse(name, player.index, false, ''));
                sendMessage(ws, response);
                console.log('Player reconnected:', name);
                
                setTimeout(() => {
                    broadcastRoomUpdate();
                    broadcastWinnersUpdate();
                }, 100);
            } else {
                const response = createWebSocketMessage('reg', 
                    createRegistrationResponse('', '', true, 'Invalid password'));
                sendMessage(ws, response);
                console.log('Invalid password for player:', name);
            }
            return;
        }
    }

    if (!playerExists) {
        const index = generateId();
        const newPlayer = {
            name,
            password,
            index,
            ws,
            wins: 0
        };
        
        players.set(index, newPlayer);
        
        const response = createWebSocketMessage('reg', 
            createRegistrationResponse(name, index, false, ''));
        sendMessage(ws, response);
        console.log('New player registered:', name);

        setTimeout(() => {
            broadcastRoomUpdate();
            broadcastWinnersUpdate();
        }, 100);
    }
}

function findPlayerByWebSocket(ws) {
    for (const player of players.values()) {
        if (player.ws === ws) {
            return player;
        }
    }
    return null;
}

function removePlayerFromAllRooms(playerIndex) {
    for (const [roomId, room] of rooms.entries()) {
        const userIndex = room.roomUsers.findIndex(user => user.index === playerIndex);
        if (userIndex !== -1) {
            room.roomUsers.splice(userIndex, 1);
            if (room.roomUsers.length === 0) {
                rooms.delete(roomId);
            }
            console.log(`Player ${playerIndex} removed from room ${roomId}`);
            break;
        }
    }
}

function sendMessage(ws, message) {
    if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(message));
        console.log('Sent message:', message);
    }
}

function generateId() {
    return Math.random().toString(36).substring(2, 11);
}

function handleDisconnection(ws) {

    for (const [index, player] of players.entries()) {
        if (player.ws === ws) {

            removePlayerFromAllRooms(player.index);
            
            players.delete(index);
            console.log(`Player ${player.name} removed`);
            
            broadcastRoomUpdate();
            break;
        }
    }
}

function handleMessage(ws, data) {
    try {
        const message = JSON.parse(data.toString());
        console.log('Received message:', message);
        
        switch (message.type) {
            case 'reg':
                handleRegistration(ws, message.data);
                break;
            case 'create_room':
                handleCreateRoom(ws);
                break;
            case 'add_user_to_room':
                handleAddUserToRoom(ws, message.data);
                break;
            default:
                console.log('Unknown message type:', message.type);
        }
    } catch (error) {
        console.error('Error parsing message:', error);
    }
}

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (data) => {
        handleMessage(ws, data);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        handleDisconnection(ws);
    });

    ws.on('error', (error) => {
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
