import api from "./api";

export const getAllUsers = () => api.get("/admin/users");
export const updateUserRole = (userId, role) => api.put(`/admin/users/${userId}/role`, { role });
export const getPlatformStats = () => api.get("/admin/stats");
export const assignCoach = (userId, coachId) => api.put(`/admin/users/${userId}/assign-coach`, { coach_id: coachId });