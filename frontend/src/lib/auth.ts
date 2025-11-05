import axiosInstance from "../axios";

const JWT_EXPIRES_IN = parseInt(
  import.meta.env.VITE_JWT_EXPIRES_IN || "1296000"
);

export const setToken = (token: string): void => {
  localStorage.setItem("auth_token", token);
  localStorage.setItem("auth_token_timestamp", Date.now().toString());
};

export const isTokenExpired = (): boolean => {
  const timestamp = localStorage.getItem("auth_token_timestamp");
  if (!timestamp) return true;

  const tokenAge = (Date.now() - parseInt(timestamp)) / 1000;
  return tokenAge >= JWT_EXPIRES_IN;
};

export const getToken = (): string | null => {
  const token = localStorage.getItem("auth_token");
  if (!token) return null;

  if (isTokenExpired()) {
    removeToken();
    return null;
  }

  return token;
};

export const removeToken = (): void => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_token_timestamp");
};

export const setUser = (username: string, userOrgIds: string[]): void => {
  const userData = { username, userOrgIds };
  localStorage.setItem("auth_user", JSON.stringify(userData));
};

export const getUser = (): {
  username: string;
  userOrgIds: string[];
} | null => {
  const userStr = localStorage.getItem("auth_user");
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error("Failed to parse user data:", error);
    return null;
  }
};

export const removeUser = (): void => {
  localStorage.removeItem("auth_user");
};

export const login = async (username: string, password: string) => {
  try {
    const response = await axiosInstance.post("/login", {
      username,
      password,
    });

    setToken(response.data.token);
    setUser(username, response.data.org_ids);

    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.detail || "Login failed";
    throw new Error(errorMessage);
  }
};

export const signup = async (username: string, password: string) => {
  try {
    const response = await axiosInstance.post("/signup", {
      username,
      password,
    });

    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.detail || "Signup failed";
    throw new Error(errorMessage);
  }
};

export const logout = (): void => {
  removeToken();
  removeUser();
};

export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};
