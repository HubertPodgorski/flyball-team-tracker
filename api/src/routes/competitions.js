const express = require("express");
const multer = require("multer");
const os = require("os");
const crypto = require("crypto");
const decodeToken = require("../middleware/decodeToken");
const { previewEjsImport, confirmEjsImport, getCompetitionStats, getAllCompetitionStats, getImportedCompetitionIds } = require("../controllers/competitionController");

const router = express.Router();

// A multi-day competition is exported as one .xls/.xlsx per day - well under this, but not "one or two".
const MAX_FILES = 20;

// node-xlrd only reads from a file path, not a buffer - diskStorage into the OS temp dir, cleaned up per-file in the controller once parsed.
const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (req, file, callback) => callback(null, crypto.randomUUID()),
  }),
});

const uploadFiles = upload.array("files", MAX_FILES);

// Turn multer's own errors (too many files, etc.) into the same 400 shape as every other import validation failure, not a 500.
const acceptFiles = (req, res, next) =>
  uploadFiles(req, res, (error) => {
    if (error) return res.status(400).json({ error: "TOO_MANY_FILES" });

    next();
  });

router.use(decodeToken);

router.get("/imported", getImportedCompetitionIds);
router.get("/all-stats", getAllCompetitionStats);
router.post("/:eventId/ejs-preview", acceptFiles, previewEjsImport);
router.post("/:eventId/ejs-confirm", acceptFiles, confirmEjsImport);
router.get("/:eventId/stats", getCompetitionStats);

module.exports = router;
