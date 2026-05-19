const SESSION_KEY = "qbg_session_id";

export function getSessionId() {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}
