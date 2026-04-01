const mongoose = require("mongoose");
const User = require("../models/User");
const Lead = require("../models/Lead");
const VoiceSession = require("../models/VoiceSession");
const Transcript = require("../models/Transcript");
const AIResponse = require("../models/AIResponse");
const { getConnectionMode, isDatabaseConnected } = require("../config/db");

const memoryStore = {
  users: [],
  leads: [],
  voiceSessions: [],
  transcripts: [],
  aiResponses: []
};

function createMemoryId() {
  return new mongoose.Types.ObjectId().toString();
}

function toSerializable(document) {
  if (!document) {
    return null;
  }

  const plainObject =
    typeof document.toObject === "function" ? document.toObject() : { ...document };

  return {
    ...plainObject,
    id: String(plainObject._id || plainObject.id)
  };
}

function sameId(left, right) {
  return String(left) === String(right);
}

function sortDescendingByDate(left, right) {
  const leftValue = new Date(left.startedAt || left.createdAt || 0).getTime();
  const rightValue = new Date(right.startedAt || right.createdAt || 0).getTime();
  return rightValue - leftValue;
}

async function createUser(payload) {
  if (isDatabaseConnected()) {
    return toSerializable(await User.create(payload));
  }

  const user = {
    _id: createMemoryId(),
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  memoryStore.users.push(user);
  return toSerializable(user);
}

async function getUserById(userId) {
  if (isDatabaseConnected()) {
    return toSerializable(await User.findById(userId));
  }

  return toSerializable(memoryStore.users.find((user) => sameId(user._id, userId)));
}

async function createLead(payload) {
  if (isDatabaseConnected()) {
    return toSerializable(await Lead.create(payload));
  }

  const lead = {
    _id: createMemoryId(),
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  memoryStore.leads.push(lead);
  return toSerializable(lead);
}

async function listLeads(userId) {
  if (isDatabaseConnected()) {
    const query = userId ? { userId } : {};
    const leads = await Lead.find(query).sort({ createdAt: -1 }).lean();
    return leads.map(toSerializable);
  }

  return memoryStore.leads
    .filter((lead) => (userId ? sameId(lead.userId, userId) : true))
    .sort(sortDescendingByDate)
    .map(toSerializable);
}

async function createVoiceSession(payload) {
  if (isDatabaseConnected()) {
    return toSerializable(await VoiceSession.create(payload));
  }

  const session = {
    _id: createMemoryId(),
    status: "initiated",
    startedAt: new Date().toISOString(),
    endedAt: null,
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  memoryStore.voiceSessions.push(session);
  return toSerializable(session);
}

async function updateVoiceSession(sessionId, payload) {
  if (isDatabaseConnected()) {
    const updatedSession = await VoiceSession.findByIdAndUpdate(sessionId, payload, {
      new: true
    });
    return toSerializable(updatedSession);
  }

  const sessionIndex = memoryStore.voiceSessions.findIndex((session) =>
    sameId(session._id, sessionId)
  );

  if (sessionIndex === -1) {
    return null;
  }

  memoryStore.voiceSessions[sessionIndex] = {
    ...memoryStore.voiceSessions[sessionIndex],
    ...payload,
    updatedAt: new Date().toISOString()
  };

  return toSerializable(memoryStore.voiceSessions[sessionIndex]);
}

async function saveTranscript(payload) {
  if (isDatabaseConnected()) {
    return toSerializable(await Transcript.create(payload));
  }

  const transcript = {
    _id: createMemoryId(),
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  memoryStore.transcripts.push(transcript);
  return toSerializable(transcript);
}

async function saveAiResponse(payload) {
  if (isDatabaseConnected()) {
    return toSerializable(await AIResponse.create(payload));
  }

  const aiResponse = {
    _id: createMemoryId(),
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  memoryStore.aiResponses.push(aiResponse);
  return toSerializable(aiResponse);
}

async function getHistoryForUser(userId) {
  if (isDatabaseConnected()) {
    const sessions = (await VoiceSession.find({ userId }).sort({ startedAt: -1 }).lean()).map(
      toSerializable
    );
    const transcripts = (await Transcript.find({ userId }).sort({ createdAt: -1 }).lean()).map(
      toSerializable
    );
    const responses = (await AIResponse.find({ userId }).sort({ createdAt: -1 }).lean()).map(
      toSerializable
    );

    return sessions.map((session) => ({
      ...session,
      transcript:
        transcripts.find((item) => sameId(item.sessionId, session.id || session._id)) || null,
      response:
        responses.find((item) => sameId(item.sessionId, session.id || session._id)) || null
    }));
  }

  return memoryStore.voiceSessions
    .filter((session) => sameId(session.userId, userId))
    .sort(sortDescendingByDate)
    .map((session) => {
      const safeSession = toSerializable(session);
      return {
        ...safeSession,
        transcript:
          memoryStore.transcripts
            .map(toSerializable)
            .find((item) => sameId(item.sessionId, safeSession.id)) || null,
        response:
          memoryStore.aiResponses
            .map(toSerializable)
            .find((item) => sameId(item.sessionId, safeSession.id)) || null
      };
    });
}

function getStorageStatus() {
  return getConnectionMode();
}

module.exports = {
  createLead,
  createUser,
  createVoiceSession,
  getHistoryForUser,
  getStorageStatus,
  getUserById,
  listLeads,
  saveAiResponse,
  saveTranscript,
  updateVoiceSession
};

