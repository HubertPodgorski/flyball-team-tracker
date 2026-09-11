const express = require("express");
const multer = require("multer");
const os = require("os");
const crypto = require("crypto");
const decodeToken = require("../middleware/decodeToken");
const requireSuperAdmin = require("../middleware/requireSuperAdmin");
const {
  previewEjsImport,
  confirmEjsImport,
  getEjsCompetitions,
  getImportedCompetitionIds,
  getCompetitionStats,
  getAllCompetitionStats,
  getGlobalTeamMapping,
  setCompetitionTeamMapping,
  getAllTeamMappings,
  setAdminTeamMapping,
} = require("../controllers/competitionController");

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

// Reads - every authenticated user.
router.get("/imported", getImportedCompetitionIds);
router.get("/ejs-competitions", getEjsCompetitions);
router.get("/all-stats", getAllCompetitionStats);
router.get("/team-mapping", getGlobalTeamMapping);
router.post("/team-mapping", setCompetitionTeamMapping);
router.get("/:eventId/stats", getCompetitionStats);

// Imports and the global team-name -> club mapping grid - super-admin only.
router.get("/team-mappings", requireSuperAdmin, getAllTeamMappings);
router.post("/team-mappings", requireSuperAdmin, setAdminTeamMapping);
router.post("/:eventId/ejs-preview", requireSuperAdmin, acceptFiles, previewEjsImport);
router.post("/:eventId/ejs-confirm", requireSuperAdmin, acceptFiles, confirmEjsImport);

module.exports = router;
