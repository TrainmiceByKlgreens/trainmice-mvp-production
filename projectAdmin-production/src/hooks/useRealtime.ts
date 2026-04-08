import { useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';

// Get API URL from env or fallback, same as ApiClient
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD
    ? window.location.origin + '/api'
    : 'http://localhost:3000/api');

// The socket server is at the root (not /api)
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');

let socket: Socket | null = null;

export const useRealtime = (onUpdate?: (payload: { table: string; action: string; data: any }) => void) => {
    // Store the callback in a ref to avoid stale closures in the socket listener
    const handlerRef = useRef(onUpdate);

    useEffect(() => {
        handlerRef.current = onUpdate;
    }, [onUpdate]);

    useEffect(() => {
        if (!socket) {
            socket = io(SOCKET_URL, {
                reconnectionAttempts: 5,
                reconnectionDelay: 5000,
            });

            socket.on('connect', () => {
                console.log('📡 Connected to real-time server');
            });

            socket.on('connect_error', (err: any) => {
                console.error('❌ Real-time connection error:', err);
            });
        }

        const handleUpdate = (payload: any) => {
            console.log('🔄 Data updated:', payload.table, payload.action);
            if (handlerRef.current) {
                handlerRef.current(payload);
            }

            // Global event for parts of the app not using the hook
            window.dispatchEvent(new CustomEvent('data:updated', { detail: payload }));
        };

        socket.on('DATA_UPDATED', handleUpdate);

        return () => {
            if (socket) {
                socket.off('DATA_UPDATED', handleUpdate);
            }
        };
    }, []); // Listener binds only once per mount

    const emit = useCallback((event: string, data: any) => {
        if (socket) {
            socket.emit(event, data);
        }
    }, []);

    return { socket, emit };
};
