const express = require("express");
const router = express.Router();
const {
  getLookbooks,
  getLookbookBySlug,
  createLookbook,
  updateLookbook,
} = require("../controllers/lookbookController");
const { protect, admin } = require("../middleware/auth");

router.route("/").get(getLookbooks).post(protect, admin, createLookbook);
router
  .route("/:slug")
  .get(getLookbookBySlug)
  .put(protect, admin, updateLookbook);

module.exports = router;
