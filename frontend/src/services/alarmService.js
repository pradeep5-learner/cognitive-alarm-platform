import api from "./api";

export const getAlarms = () => api.get("/alarms/");
export const createAlarm = (data) => api.post("/alarms/", data);
export const updateAlarm = (id, data) => api.put(`/alarms/${id}`, data);
export const deleteAlarm = (id) => api.delete(`/alarms/${id}`);