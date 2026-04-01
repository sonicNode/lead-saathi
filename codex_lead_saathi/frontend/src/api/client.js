const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const { method = "GET", headers = {}, body } = options;
  const requestOptions = {
    method,
    headers: { ...headers }
  };

  if (body instanceof FormData) {
    requestOptions.body = body;
  } else if (body !== undefined) {
    requestOptions.headers["Content-Type"] = "application/json";
    requestOptions.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, requestOptions);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export const api = {
  getHealth() {
    return request("/api/health");
  },
  onboardUser(payload) {
    return request("/api/users/onboard", {
      method: "POST",
      body: payload
    });
  },
  createLead(payload) {
    return request("/api/leads", {
      method: "POST",
      body: payload
    });
  },
  listLeads(userId) {
    return request(`/api/leads?userId=${encodeURIComponent(userId)}`);
  },
  getHistory(userId) {
    return request(`/api/voice/history/${encodeURIComponent(userId)}`);
  },
  sendTextResponse(payload) {
    return request("/api/voice/respond", {
      method: "POST",
      body: payload
    });
  },
  sendAudioResponse({ userId, audioBlob, targetLanguageCode }) {
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("targetLanguageCode", targetLanguageCode);
    formData.append("audio", audioBlob, "recording.webm");

    return request("/api/voice/respond", {
      method: "POST",
      body: formData
    });
  }
};

