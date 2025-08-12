const API_BASE_URL = import.meta.env.VITE_API_URL;

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // User endpoints
  async syncUser(token) {
    return this.request("/api/users/sync", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async updateUserProfile(token, userData) {
    return this.request("/api/users/profile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
  }

  async getUserProfile(token) {
    return this.request("/api/users/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getLeaderboard() {
    return this.request("/api/users/leaderboard");
  }

  // Note: Duel room operations are handled via socket.io, not HTTP endpoints
}

export const apiClient = new ApiClient();
