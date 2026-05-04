// Chemin : frontend/src/config/api.config.js
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1",
  TIMEOUT:  15_000,

  ENDPOINTS: {
    AUTH: {
      LOGIN:   "/auth/login",
      REFRESH: "/auth/refresh",
      LOGOUT:  "/auth/logout",
      ME:      "/auth/me",
    },
    DEMANDES:    "/demandes",
    SUIVIS:      "/suivis",
    COMPLEMENTS: "/complements",
    VISITES:     "/visites",
  },
};

export const TOKEN_KEY =
  import.meta.env.VITE_TOKEN_KEY ?? "gd_access_token";

export const REFRESH_TOKEN_KEY =
  import.meta.env.VITE_REFRESH_TOKEN_KEY ?? "gd_refresh_token";
  