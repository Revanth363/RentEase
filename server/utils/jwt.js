// server/utils/jwt.js
// server/utils/jwt.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn(
    "WARNING: process.env.JWT_SECRET is not set. Use a strong 64+ char secret in production."
  );
}

function signToken(payload, options = {}) {
  const signOptions = {};
  if (options.expiresIn) signOptions.expiresIn = options.expiresIn;
  else signOptions.expiresIn = "1h";
  return jwt.sign(payload, JWT_SECRET, signOptions);
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  signToken,
  verifyToken,
};
