import EventEmitter from "events";

/**
 * Shared in-process event emitter for domain events.
 */
export const eventBus = new EventEmitter();

/**
 * Notification-related domain event names emitted by services.
 */
export const NOTIFICATION_EVENTS = {
  POST_LIKED: "POST_LIKED",
  POST_COMMENTED: "POST_COMMENTED",
  POST_MENTIONED: "POST_MENTIONED",
  COMMENT_LIKED: "COMMENT_LIKED",
  COMMENT_REPLIED: "COMMENT_REPLIED",
  COMMENT_MENTIONED: "COMMENT_MENTIONED",
  FOLLOW_REQUEST: "FOLLOW_REQUEST",
  FOLLOW_ACCEPTED: "FOLLOW_ACCEPTED",
};

/**
 * Wraps domain payloads with metadata before publishing to the event bus.
 * @param {string} type - Event type from NOTIFICATION_EVENTS.
 * @param {Object} data - Event payload.
 * @returns {{type: string, timestamp: Date, data: Object}} Domain event.
 */
export const createDomainEvent = (type, data) => ({
  type,
  timestamp: new Date(),
  data,
});
