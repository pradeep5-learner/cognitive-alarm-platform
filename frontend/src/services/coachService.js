import api from "./api";

export const getMyAssignedUsers = () => api.get("/coach/my-users");