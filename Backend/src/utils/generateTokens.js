const jwtService = require("../services/jwtService");

const ACCESS_EXPIRES = process.env.ACCESS_EXPIRES || "15m";
const REFRESH_EXPIRES = process.env.REFRESH_EXPIRES || "7d";

exports.generate = (user) => {
  const payload = { id: user._id };
  const access = jwtService.sign(payload, { expiresIn: ACCESS_EXPIRES });
  const refresh = jwtService.sign(payload, { expiresIn: REFRESH_EXPIRES });
  return { access, refresh };
};

exports.verifyRefresh = (token) => jwtService.verify(token);
