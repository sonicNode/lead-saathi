const env = require("../config/env");
const { getVoiceProvider } = require("../services/voice");
const storageService = require("../services/storageService");
const { generateAssistantReply } = require("../services/assistantService");
const { createHttpError } = require("../utils/httpError");

function resolveSessionId(sessionOrId) {
  if (!sessionOrId) {
    return null;
  }

  return typeof sessionOrId === "string"
    ? sessionOrId
    : String(sessionOrId.id || sessionOrId._id);
}

async function transcribeAudio(req, res) {
  const { userId, languageCode } = req.body;

  if (!userId) {
    throw createHttpError(400, "userId is required.");
  }

  if (!req.file) {
    throw createHttpError(400, "Audio file is required.");
  }

  const voiceProvider = getVoiceProvider();
  const session = await storageService.createVoiceSession({
    userId,
    status: "initiated"
  });
  const sessionId = resolveSessionId(session);

  try {
    const transcript = await voiceProvider.transcribeAudio({
      buffer: req.file.buffer,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      languageCode: languageCode || env.sarvamDefaultLanguage
    });

    const savedTranscript = await storageService.saveTranscript({
      sessionId,
      userId,
      source: "audio",
      transcriptText: transcript.transcript,
      languageCode: transcript.languageCode,
      provider: transcript.provider,
      requestId: transcript.requestId || ""
    });

    await storageService.updateVoiceSession(sessionId, {
      status: "transcribed"
    });

    res.json({
      sessionId,
      transcript: savedTranscript
    });
  } catch (error) {
    await storageService.updateVoiceSession(sessionId, {
      status: "failed",
      endedAt: new Date()
    });
    throw error;
  }
}

async function generateVoiceResponse(req, res) {
  const { userId, text, sessionId: requestedSessionId, targetLanguageCode, languageCode } = req.body;

  if (!userId) {
    throw createHttpError(400, "userId is required.");
  }

  if (!text?.trim() && !req.file) {
    throw createHttpError(400, "Provide text input or an audio file.");
  }

  const voiceProvider = getVoiceProvider();
  const user = await storageService.getUserById(userId);

  if (!user) {
    throw createHttpError(404, "User not found.");
  }

  const session =
    requestedSessionId ||
    (await storageService.createVoiceSession({
      userId,
      status: "initiated"
    }));
  const sessionId = resolveSessionId(session);

  try {
    let transcriptText = text?.trim() || "";
    let transcriptLanguage = languageCode || user.language || env.sarvamDefaultLanguage;
    let transcriptProvider = "manual";
    let transcriptRequestId = "";

    if (req.file) {
      const transcription = await voiceProvider.transcribeAudio({
        buffer: req.file.buffer,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        languageCode: languageCode || user.language || env.sarvamDefaultLanguage
      });

      transcriptText = transcription.transcript;
      transcriptLanguage = transcription.languageCode;
      transcriptProvider = transcription.provider;
      transcriptRequestId = transcription.requestId || "";
    }

    const savedTranscript = await storageService.saveTranscript({
      sessionId,
      userId,
      source: req.file ? "audio" : "text",
      transcriptText,
      languageCode: transcriptLanguage,
      provider: transcriptProvider,
      requestId: transcriptRequestId
    });

    const assistantReply = await generateAssistantReply({
      transcriptText,
      user
    });

    const speech = await voiceProvider.synthesizeSpeech({
      text: assistantReply.responseText,
      targetLanguageCode: targetLanguageCode || transcriptLanguage
    });

    const savedResponse = await storageService.saveAiResponse({
      sessionId,
      userId,
      inputText: transcriptText,
      responseText: assistantReply.responseText,
      provider: speech.provider,
      audioMimeType: speech.audioMimeType,
      audioByteLength: speech.audioByteLength
    });

    await storageService.updateVoiceSession(sessionId, {
      status: "responded",
      endedAt: new Date()
    });

    res.json({
      sessionId,
      transcript: savedTranscript,
      response: savedResponse,
      audio: {
        audioBase64: speech.audioBase64,
        audioMimeType: speech.audioMimeType
      },
      metadata: {
        intent: assistantReply.intent,
        voiceProvider: speech.provider
      }
    });
  } catch (error) {
    await storageService.updateVoiceSession(sessionId, {
      status: "failed",
      endedAt: new Date()
    });
    throw error;
  }
}

async function textToSpeech(req, res) {
  const { text, targetLanguageCode } = req.body;

  if (!text || !text.trim()) {
    throw createHttpError(400, "Text is required.");
  }

  const voiceProvider = getVoiceProvider();
  const speech = await voiceProvider.synthesizeSpeech({
    text: text.trim(),
    targetLanguageCode: targetLanguageCode || env.sarvamDefaultLanguage
  });

  res.json({
    audioBase64: speech.audioBase64,
    audioMimeType: speech.audioMimeType,
    provider: speech.provider
  });
}

async function getHistory(req, res) {
  const { userId } = req.params;

  if (!userId) {
    throw createHttpError(400, "userId is required.");
  }

  const history = await storageService.getHistoryForUser(userId);

  res.json({
    items: history
  });
}

module.exports = {
  generateVoiceResponse,
  getHistory,
  textToSpeech,
  transcribeAudio
};

