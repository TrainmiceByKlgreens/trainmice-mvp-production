import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export const initSocket = (server: HTTPServer) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: "*", // Adjust as needed for security
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('📱 Real-time client connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('📱 Real-time client disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io has not been initialized');
    }
    return io;
};

export const broadcastUpdate = (table: string, action: string, data: any) => {
    if (io) {
        io.emit('DATA_UPDATED', { table, action, data });
    }
};
