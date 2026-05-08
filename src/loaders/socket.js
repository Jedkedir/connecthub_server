import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let io;

export const initSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.corsOrigin === '*' ? true : env.corsOrigin,
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    const { userId } = socket.handshake.query;

    if (!userId) {
      socket.disconnect(true);
      return;
    }

    socket.join(userId.toString());
    logger.info('Socket connected', { socketId: socket.id, userId });
  });

  return io;
};

export const emitNotification = (recipientId, notification) => {
  if (!io || !recipientId) return;
  io.to(recipientId.toString()).emit('notification', notification);
};
