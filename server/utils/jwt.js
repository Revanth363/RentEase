// server/utils/jwt.js
const jwt = require("jsonwebtoken");

// Read JWT_SECRET at runtime (not at module load time) to ensure env vars are available
function getJWTSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn(
      "WARNING: process.env.JWT_SECRET is not set. Use a strong 64+ char secret in production."
    );
  }
  return secret;
}

function signToken(payload, options = {}) {
  const JWT_SECRET = getJWTSecret();
  const signOptions = {};
  if (options.expiresIn) signOptions.expiresIn = options.expiresIn;
  else signOptions.expiresIn = "1h";
  return jwt.sign(payload, JWT_SECRET, signOptions);
}

function verifyToken(token) {
  const JWT_SECRET = getJWTSecret();
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  signToken,
  verifyToken,
};
