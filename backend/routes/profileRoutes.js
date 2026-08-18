const express = require("express");
const router = express.Router();
const { getMyProfile, updateApiKeys, getLlmUsage } = require("../controllers/profileController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/me", protect, getMyProfile);
router.put("/keys", protect, updateApiKeys);
router.get("/usage", protect, getLlmUsage);

module.exports = router;