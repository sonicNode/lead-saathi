const mongoose = require("mongoose");

const aiResponseSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VoiceSession",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    inputText: {
      type: String,
      required: true
    },
    responseText: {
      type: String,
      required: true
    },
    provider: {
      type: String,
      default: "mock"
    },
    audioMimeType: {
      type: String,
      default: "audio/wav"
    },
    audioByteLength: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt"
    }
  }
);

module.exports = mongoose.model("AIResponse", aiResponseSchema);

