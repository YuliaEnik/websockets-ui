import { httpServer } from "./src/http_server/index.js";
import { WebSocketServer } from 'ws';
import { createWebSocketMessage, createRegistrationResponse } from './src/types.js';

const HTTP_PORT = 8181;
const WS_PORT = 3000;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const wss = new WebSocketServer({ port: WS_PORT });
console.log(`WebSocket server started on port ${WS_PORT}`);

const players = new Map();

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
        const index = generatePlayerId();
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
    }
}

function sendMessage(ws, message) {
    if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(message));
        console.log('Sent message:', message);
    }
}

function generatePlayerId() {
    return Math.random().toString(36).substring(2, 11);
}

function handleDisconnection(ws) {
    for (const [index, player] of players.entries()) {
        if (player.ws === ws) {
            players.delete(index);
            console.log(`Player ${player.name} removed`);
            break;
        }
    }
}

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log('Received message:', message);
            
            if (message.type === 'reg') {
                handleRegistration(ws, message.data);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
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

