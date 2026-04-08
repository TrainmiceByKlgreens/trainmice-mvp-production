import { Client } from 'pg';
import { broadcastUpdate } from './socket';

const dbConfig = {
    connectionString: process.env.DATABASE_URL,
};

export const initDBListener = async () => {
    const client = new Client(dbConfig);

    try {
        await client.connect();
        console.log('🐘 PostgreSQL Listener connected');

        await client.query('LISTEN table_update');

        client.on('notification', (msg) => {
            if (msg.channel === 'table_update' && msg.payload) {
                try {
                    const payload = JSON.parse(msg.payload);
                    console.log(`📡 Real-time update: ${payload.table} | ${payload.action}`);
                    broadcastUpdate(payload.table, payload.action, payload.data);
                } catch (err) {
                    console.error('❌ Failed to parse DB notification payload:', err);
                }
            }
        });

        client.on('error', (err) => {
            console.error('❌ PostgreSQL Listener error:', err);
            // Attempt to reconnect after a delay
            setTimeout(initDBListener, 5000);
        });

    } catch (err) {
        console.error('❌ Failed to connect PostgreSQL Listener:', err);
        setTimeout(initDBListener, 5000);
    }
};
