const express = require("express");
const multer = require("multer");
const os = require("os");
const crypto = require("crypto");
const decodeToken = require("../middleware/decodeToken");
const { previewEjsImport, confirmEjsImport, getCompetitionStats } = require("../controllers/competitionController");

const router = express.Router();

// node-xlrd only reads from a file path, not a buffer - diskStorage into the OS temp dir, cleaned up per-file in the controller once parsed.
const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (req, file, callback) => callback(null, crypto.randomUUID()),
  }),
});

router.use(decodeToken);

router.post("/:eventId/ejs-preview", upload.array("files", 2), previewEjsImport);
router.post("/:eventId/ejs-confirm", upload.array("files", 2), confirmEjsImport);
router.get("/:eventId/stats", getCompetitionStats);

module.exports = router;
