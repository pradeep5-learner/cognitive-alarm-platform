import api from "./api";

export const logProductivity = (rating, note = null) =>
  api.post("/productivity/log", { rating, note });
export const getProductivityHistory = () => api.get("/productivity/history");
export const getProductivityCorrelation = () => api.get("/productivity/correlation");