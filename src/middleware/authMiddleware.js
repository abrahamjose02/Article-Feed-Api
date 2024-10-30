const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

exports.isAuthenticated = (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    res.status(401).json({ message: "Not authorized, no token" });
    return;
  }
  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};
