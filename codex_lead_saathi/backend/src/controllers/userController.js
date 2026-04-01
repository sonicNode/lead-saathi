const storageService = require("../services/storageService");
const { createHttpError } = require("../utils/httpError");

async function onboardUser(req, res) {
  const { name, phone, email, language } = req.body;

  if (!name || !name.trim()) {
    throw createHttpError(400, "Name is required.");
  }

  const user = await storageService.createUser({
    name: name.trim(),
    phone: phone?.trim() || "",
    email: email?.trim() || "",
    language: language?.trim() || "en-IN"
  });

  res.status(201).json({
    message: "User onboarded successfully.",
    user
  });
}

module.exports = {
  onboardUser
};

