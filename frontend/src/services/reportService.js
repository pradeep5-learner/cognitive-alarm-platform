import api from "./api";

export const downloadPdfReport = () => api.get("/reports/pdf", { responseType: "blob" });
export const downloadExcelReport = () => api.get("/reports/excel", { responseType: "blob" });
export const downloadSystemPdfReport = () => api.get("/reports/system/pdf", { responseType: "blob" });
export const downloadSystemExcelReport = () => api.get("/reports/system/excel", { responseType: "blob" });