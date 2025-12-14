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
        // Try to get error message from response body
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();

          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If we can't parse the error response, use the default message
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();

      return data;
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

  async getCurrentUser(token) {
    return this.request("/api/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getLeaderboard() {
    return this.request("/api/users/leaderboard");
  }

  async getDuelHistory(token, page = 1, limit = 10, duelType = null) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (duelType) {
      params.append("duelType", duelType);
    }

    return this.request(`/api/users/duel-history?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Practice endpoints
  async getPracticeLanguages() {
    return this.request("/api/practice/languages");
  }

  async executePracticeCode(token, codeData) {
    return this.request("/api/practice/execute", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(codeData),
    });
  }

  async savePracticeSession(token, sessionData) {
    return this.request("/api/practice/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionData),
    });
  }

  async getPracticeSessions(token, page = 1, limit = 10) {
    return this.request(`/api/practice/sessions?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Note: Duel room operations are handled via socket.io, not HTTP endpoints
}

export const apiClient = new ApiClient();
