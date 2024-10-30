const express = require("express");
const {
  registerUser,
  login,
  activateUser,
  updateUser,
  logout,
  getUserProfile,
} = require("../controller/authController");
const { isAuthenticated } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);

router.post("/activate", activateUser);

router.post("/login", login);

router.post("/update", isAuthenticated, updateUser);

router.get("/profile", isAuthenticated, getUserProfile);

router.post("/logout", logout);

module.exports = router;
