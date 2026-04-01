const mongoose = require("mongoose");

const transcriptSchema = new mongoose.Schema(
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
    source: {
      type: String,
      enum: ["audio", "text"],
      default: "audio"
    },
    transcriptText: {
      type: String,
      required: true
    },
    languageCode: {
      type: String,
      default: "en-IN"
    },
    provider: {
      type: String,
      default: "mock"
    },
    requestId: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt"
    }
  }
);

module.exports = mongoose.model("Transcript", transcriptSchema);

