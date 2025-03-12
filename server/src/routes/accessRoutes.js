//Access routes

const express = require("express");
const { login, register } = require("../controllers/accessController");

const router = express.Router();

//Authentication Routes
router.post("/register", register);
router.post("/login", login);

module.exports = router;