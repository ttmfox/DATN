import axios from "axios";

const API_URL = "http://localhost:8080/tirashop/auth/login";

// Giải mã payload từ JWT
const parseJwt = (token) => {
  try {
    const base64Payload = token.split(".")[1];
    const payload = atob(base64Payload);
    return JSON.parse(payload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export const login = async (username, password) => {
  try {
    const response = await axios.post(API_URL, { username, password });
    const token = response.data.data?.token;

    if (!token) {
      console.warn("Token not found in response");
      return null;
    }

    const decoded = parseJwt(token);

    if (decoded?.scope !== "ROLE_ADMIN") {
      console.warn("Access denied: Not an admin");
      throw new Error("Access denied: Only admins can login.");
    }

    // Nếu là ROLE_ADMIN thì lưu token và set header
    localStorage.setItem("token", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    return token;
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  delete axios.defaults.headers.common["Authorization"];
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const setAuthHeader = () => {
  const token = getToken();
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
};

setAuthHeader();
