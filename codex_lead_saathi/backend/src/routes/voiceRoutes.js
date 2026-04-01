const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const upload = require("../middleware/upload");
const {
  generateVoiceResponse,
  getHistory,
  textToSpeech,
  transcribeAudio
} = require("../controllers/voiceController");

const router = express.Router();

router.post("/transcribe", upload.single("audio"), asyncHandler(transcribeAudio));
router.post("/respond", upload.single("audio"), asyncHandler(generateVoiceResponse));
router.post("/text-to-speech", asyncHandler(textToSpeech));
router.get("/history/:userId", asyncHandler(getHistory));

module.exports = router;

