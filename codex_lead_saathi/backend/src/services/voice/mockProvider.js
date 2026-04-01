const { createWaveTone } = require("../../utils/createWaveTone");

async function transcribeAudio({ filename, languageCode }) {
  return {
    provider: "mock",
    requestId: `mock-stt-${Date.now()}`,
    transcript: `Mock transcript captured from ${filename || "uploaded-audio"}. Replace this with Sarvam once the API key is ready.`,
    languageCode: languageCode || "en-IN"
  };
}

async function synthesizeSpeech({ text, targetLanguageCode }) {
  const audioBuffer = createWaveTone();

  return {
    provider: "mock",
    requestId: `mock-tts-${Date.now()}`,
    audioBase64: audioBuffer.toString("base64"),
    audioMimeType: "audio/wav",
    audioByteLength: audioBuffer.length,
    targetLanguageCode: targetLanguageCode || "en-IN",
    text
  };
}

module.exports = {
  providerName: "mock",
  synthesizeSpeech,
  transcribeAudio
};

