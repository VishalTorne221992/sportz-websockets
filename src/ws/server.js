import { WebSocket, WebSocketServer } from 'ws';
import { wsArcjet } from '../arcjet.js';

function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
    for (const client of wss.clients) {
        if (client.readyState !== WebSocket.OPEN) continue;

        client.send(JSON.stringify(payload))
    }
}

export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 1024 * 1024 })

    wss.on('connection', async (socket, req) => {

        if(wsArcjet){
            try {

                const desicion = await wsArcjet.protect(req);

                if(desicion.isDenied()){
                    const code = desicion.reason.isRateLimit() ? 1013 : 1008;
                    const reason = desicion.reason.isRateLimit() ? 'Rate Limit exceeded' : 'Access denied';

                    socket.close(code, reason);
                    return;
                }

                
            } catch (error) {
                console.error('WS connection error', error);
                socket.close(code, reason);
                return;
            }
        }

        socket.isAlive = true;
        socket.on('pong', () => { socket.isAlive = true; });

        sendJson(socket, { type: 'welcome' });

        socket.on('error', console.error)
    });

    // Heartbeat interval to detect stale connections
    const interval = setInterval(() => {
        for (const client of wss.clients) {
            if (client.isAlive === false) {
                return client.terminate();
            }
            client.isAlive = false;
            client.ping();
        }
    }, 30000);

    wss.on('close', () => clearInterval(interval));

    function broadcastMatchCreated(match) {
        broadcast(wss, { type: 'match created', data: match })
    }

    return { broadcastMatchCreated }
}

