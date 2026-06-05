import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let io;

/**
 * Attaches Socket.IO to the HTTP server and joins users to private rooms.
 * @param {import('http').Server} server - HTTP server instance.
 * @returns {Server} Configured Socket.IO server.
 */
export const initSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.corsOrigin === '*' ? true : env.corsOrigin,
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    logger.info('Socket connection attempt', { socketId: socket.id });
    const { userId } = socket.handshake.query;
    if (!userId) {
      socket.disconnect(true);
      logger.warn('Socket connection rejected due to missing userId', { socketId: socket.id });
      return;
    }

    socket.join(userId.toString());
    logger.info('Socket connected', { socketId: socket.id });
  });

  return io;
};

/**
 * Emits a notification to the recipient's Socket.IO room when connected.
 * @param {string|Object} recipientId - Recipient user ID.
 * @param {Object} notification - Notification payload to emit.
 * @returns {void}
 */
export const emitNotification = (recipientId, notification) => {
  if (!io || !recipientId) return;
  io.to(recipientId.toString()).emit('notification', notification);
};
