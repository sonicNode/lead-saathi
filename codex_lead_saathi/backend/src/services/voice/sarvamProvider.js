const env = require("../../config/env");
const { createHttpError } = require("../../utils/httpError");

const SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text";
const SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech";

function ensureSarvamKey() {
  if (!env.sarvamApiKey) {
    throw createHttpError(
      503,
      "Sarvam API key is missing. Add SARVAM_API_KEY to backend/.env or switch VOICE_PROVIDER to mock."
    );
  }
}

async function parseSarvamResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createHttpError(
      response.status,
      data?.error?.message || "Sarvam request failed.",
      data
    );
  }

  return data;
}

async function transcribeAudio({ buffer, filename, mimetype, languageCode }) {
  ensureSarvamKey();

  const formData = new FormData();
  const blob = new Blob([buffer], { type: mimetype || "audio/webm" });

  formData.append("file", blob, filename || "recording.webm");
  formData.append("model", env.sarvamSttModel);

  if (languageCode) {
    formData.append("language_code", languageCode);
  }

  const response = await fetch(SARVAM_STT_URL, {
    method: "POST",
    headers: {
      "api-subscription-key": env.sarvamApiKey
    },
    body: formData
  });

  const data = await parseSarvamResponse(response);

  return {
    provider: "sarvam",
    requestId: data.request_id,
    transcript: data.transcript,
    languageCode: data.language_code || languageCode || env.sarvamDefaultLanguage
  };
}

async function synthesizeSpeech({ text, targetLanguageCode }) {
  ensureSarvamKey();

  const response = await fetch(SARVAM_TTS_URL, {
    method: "POST",
    headers: {
      "api-subscription-key": env.sarvamApiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      target_language_code: targetLanguageCode || env.sarvamDefaultLanguage,
      model: env.sarvamTtsModel,
      speaker: env.sarvamSpeaker,
      pace: 1,
      output_audio_codec: "wav"
    })
  });

  const data = await parseSarvamResponse(response);
  const audioBase64 = Array.isArray(data.audios) ? data.audios[0] : null;

  if (!audioBase64) {
    throw createHttpError(502, "Sarvam did not return audio data.");
  }

  return {
    provider: "sarvam",
    requestId: data.request_id,
    audioBase64,
    audioMimeType: "audio/wav",
    audioByteLength: Buffer.from(audioBase64, "base64").length,
    targetLanguageCode: targetLanguageCode || env.sarvamDefaultLanguage,
    text
  };
}

module.exports = {
  providerName: "sarvam",
  synthesizeSpeech,
  transcribeAudio
};

