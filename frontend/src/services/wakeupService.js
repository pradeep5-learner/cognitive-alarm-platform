import api from "./api";

export const startWakeUp = (alarmId) => api.post(`/wakeup/start/${alarmId}`);
export const submitWakeUpAnswer = (wakeupLogId, submittedAnswer) =>
  api.post("/wakeup/submit", { wakeup_log_id: wakeupLogId, submitted_answer: submittedAnswer });
export const snoozeWakeUp = (wakeupLogId) =>
  api.post("/wakeup/snooze", { wakeup_log_id: wakeupLogId });
export const getAnalytics = () => api.get("/wakeup/analytics");