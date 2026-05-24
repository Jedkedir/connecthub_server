import EventEmitter from "events";

export const eventBus = new EventEmitter();

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

export const createDomainEvent = (type, data) => ({
  type,
  timestamp: new Date(),
  data,
});
