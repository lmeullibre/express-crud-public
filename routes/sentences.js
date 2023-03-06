const express = require("express");

const router = express.Router();
const sentenceController = require("../controllers/sentences");

function apiKeyAuth(req, res, next) {
  const apiKey = req.query.api_key || req.headers["x-api-key"];
  if (apiKey !== "1234567") {
    return res.status(401).json({ error: "Invalid API key" });
  }
  next();
}
router.delete("/:id", apiKeyAuth, sentenceController.deleteSentence);
router.patch("/:id", apiKeyAuth, sentenceController.updateSentence);
router.post("/", apiKeyAuth, sentenceController.createSentence);
router.get("/", sentenceController.getJson);
router.get("/list", sentenceController.renderListPage);
router.get("/:id/edit", sentenceController.renderUpdatePage);
router.get("/new", sentenceController.renderCreatePage);

module.exports = router;
