const multer = require("multer");
const { createHttpError } = require("../utils/httpError");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter(req, file, callback) {
    if (file.mimetype && file.mimetype.startsWith("audio/")) {
      callback(null, true);
      return;
    }

    callback(createHttpError(400, "Only audio files are allowed."));
  }
});

module.exports = upload;

