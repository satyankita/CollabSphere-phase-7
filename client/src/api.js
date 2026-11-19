const DEFAULT_API_ORIGIN = import.meta.env.DEV
  ? "http://localhost:5000"
  : "https://collabsphere-api-70ke.onrender.com";

export const API_ROOT = `${import.meta.env.VITE_API_URL || DEFAULT_API_ORIGIN}/api`;
