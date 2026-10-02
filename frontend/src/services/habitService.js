import api from "./api";

export const getHabitScore = () => api.get("/habits/score");
export const getHabitScoreHistory = () => api.get("/habits/history");
export const getBehavioralAnalytics = () => api.get("/behavior/analytics");
export const getRecommendations = () => api.get("/recommendations/");
export const getDifficultyPrediction = () => api.get("/difficulty/predict");
export const getChallengePerformance = () => api.get("/challenges/performance");
export const getEngagementStatus = () => api.get("/difficulty/engagement");