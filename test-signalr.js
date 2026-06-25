const WebSocket = require('ws');

const url = 'wss://api.lazpe.store/chatHub';

console.log(`Connecting to ${url}...`);

// First negotiate
const fetch = require('node-fetch');

async function test() {
    try {
        const res = await fetch('https://api.lazpe.store/chatHub/negotiate?negotiateVersion=1', { method: 'POST' });
        const data = await res.json();
        console.log('Negotiate response:', data);

        const connectionToken = data.connectionToken;
        const wsUrl = `${url}?id=${connectionToken}`;

        const ws = new WebSocket(wsUrl);

        ws.on('open', () => {
            console.log('WebSocket connected!');
            // Send SignalR handshake protocol
            ws.send(JSON.stringify({ protocol: 'json', version: 1 }) + '\x1e');
        });

        ws.on('message', (data) => {
            console.log('Received message:', data.toString());
        });

        ws.on('close', (code, reason) => {
            console.log(`WebSocket closed: ${code} ${reason}`);
        });

        ws.on('error', (err) => {
            console.error('WebSocket error:', err);
        });

        // wait 40 seconds to see if it times out
        setTimeout(() => {
            console.log('Test completed after 40s');
            ws.close();
        }, 40000);

    } catch (e) {
        console.error(e);
    }
}

test();
