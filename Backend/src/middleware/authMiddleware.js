const jwtService = require("../services/jwtService");
const User = require("../models/User");
const { generate, verifyRefresh } = require("../utils/generateTokens");

const isProd = process.env.NODE_ENV === "production";
const cookieOptions = (ms) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  maxAge: ms,
  path: "/",
});

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
  const accessCookieToken = req.cookies && req.cookies.accessToken;
  const refreshCookieToken = req.cookies && req.cookies.refreshToken;

  // 1) Try bearer token if present
  if (bearerToken) {
    try {
      req.user = jwtService.verify(bearerToken);
      return next();
    } catch (e) {
      // keep going - bearer might be stale while cookie tokens are valid
    }
  }

  // 2) Try access token cookie
  if (accessCookieToken) {
    try {
      req.user = jwtService.verify(accessCookieToken);
      return next();
    } catch (e) {
      // keep going - access token can expire, refresh may still be valid
    }
  }

  // 3) Try refresh cookie and rotate tokens transparently
  if (refreshCookieToken) {
    try {
      const payload = verifyRefresh(refreshCookieToken);
      const user = await User.findById(payload.id);
      if (user) {
        const tokens = generate(user);
        res.cookie("accessToken", tokens.access, cookieOptions(15 * 60 * 1000));
        res.cookie(
          "refreshToken",
          tokens.refresh,
          cookieOptions(7 * 24 * 60 * 60 * 1000),
        );
        req.user = { id: String(user._id) };
        return next();
      }
    } catch (e) {
      // fall through to 401 below
    }
  }

  return res.status(401).json({ error: "Unauthorized" });
};
