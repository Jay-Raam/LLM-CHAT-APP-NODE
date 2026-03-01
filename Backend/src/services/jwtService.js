const jwt = require("jsonwebtoken");

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error("Missing JWT_SECRET. Set JWT_SECRET in Backend/.env");
}

exports.sign = (payload, opts = {}) => jwt.sign(payload, secret, opts);
exports.verify = (token) => jwt.verify(token, secret);
exports.decode = (token) => jwt.decode(token);
