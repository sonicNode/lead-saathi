const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { createLead, listLeads } = require("../controllers/leadController");

const router = express.Router();

router.get("/", asyncHandler(listLeads));
router.post("/", asyncHandler(createLead));

module.exports = router;

