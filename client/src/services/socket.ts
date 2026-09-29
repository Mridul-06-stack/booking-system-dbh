import { io, Socket } from 'socket.io-client';

const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined) || '';
// Strip trailing /api or slash to get the socket root host
const socketServerUrl = rawApiUrl ? rawApiUrl.replace(/\/api\/?$/, '') : undefined;

/**
 * Shared Socket.IO client instance.
 * In development, omitting the URL connects to window.location (handled by Vite proxy).
 * In production, connects to the configured backend origin.
 */
export const socket: Socket = io(socketServerUrl || undefined, {
    autoConnect: true,
    transports: ['websocket', 'polling'],
});

export default socket;
