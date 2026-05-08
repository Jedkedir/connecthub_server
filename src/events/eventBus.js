import EventEmitter from 'events';

export const eventBus = new EventEmitter();

export const NOTIFICATION_EVENTS = {
  POST_LIKED: 'POST_LIKED',
  POST_COMMENTED: 'POST_COMMENTED',
  FOLLOW_REQUEST: 'FOLLOW_REQUEST',
  FOLLOW_ACCEPTED: 'FOLLOW_ACCEPTED'
};

export const createDomainEvent = (type, data) => ({
  type,
  timestamp: new Date(),
  data
});
