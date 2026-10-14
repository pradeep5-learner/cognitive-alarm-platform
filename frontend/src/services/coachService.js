import api from "./api";

export const getMyAssignedUsers = () => api.get("/coach/my-users");
export const getAssignedUserDetails = (userId) => api.get(`/coach/users/${userId}/details`);
export const downloadUserPdfReport = (userId) => api.get(`/coach/users/${userId}/report/pdf`, { responseType: "blob" });
export const downloadUserExcelReport = (userId) => api.get(`/coach/users/${userId}/report/excel`, { responseType: "blob" });