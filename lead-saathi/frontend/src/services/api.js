import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const startCall = async () => {
  const res = await axios.post(`${API_BASE}/start`);
  return res.data;
};

export const transcribeAudio = async (text) => {
  const res = await axios.post(`${API_BASE}/transcribe`, { text });
  return res.data;
};

export const analyzeLead = async (transcript) => {
  const res = await axios.post(`${API_BASE}/analyze`, { transcript });
  return res.data;
};

export const scoreLead = async (analysis) => {
  const res = await axios.post(`${API_BASE}/score`, analysis);
  return res.data;
};

export const storeLead = async (leadData) => {
  const res = await axios.post(`${API_BASE}/store`, leadData);
  return res.data;
};

export const generateResponse = async (message) => {
  const res = await axios.post(`${API_BASE}/respond`, { message });
  return res.data;
};
