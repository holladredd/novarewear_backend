const express = require("express");
const router = express.Router();
const {
  getLookbook,
  createLookbook,
  updateLookbook,
} = require("../controllers/lookbookController");
const { protect, admin } = require("../middleware/auth");

router.get("/", getLookbook);
router.post("/", protect, admin, createLookbook);
router.put("/:id", protect, admin, updateLookbook);

module.exports = router;
