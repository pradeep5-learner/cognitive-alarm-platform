import api from "./api";

export const downloadPdfReport = () => api.get("/reports/pdf", { responseType: "blob" });
export const downloadExcelReport = () => api.get("/reports/excel", { responseType: "blob" });