const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { onboardUser } = require("../controllers/userController");

const router = express.Router();

router.post("/onboard", asyncHandler(onboardUser));

module.exports = router;

