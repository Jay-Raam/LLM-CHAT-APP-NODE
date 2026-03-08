const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { generate } = require("../utils/generateTokens");

const isProd = process.env.NODE_ENV === "production";

const cookieOptions = (ms) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  maxAge: ms,
  path: "/",
});

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Missing fields" });
    const existing = await User.findOne({ email });
    console.log("existing", existing);

    if (existing) return res.status(400).json({ error: "User exists" });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });
    const tokens = generate(user);
    res.cookie("accessToken", tokens.access, cookieOptions(15 * 60 * 1000));
    res.cookie(
      "refreshToken",
      tokens.refresh,
      cookieOptions(7 * 24 * 60 * 60 * 1000),
    );

    const safeUser = { id: user._id, name: user.name, email: user.email };
    console.log("safeUser", safeUser);

    res.json({ ok: true, user: safeUser });
  } catch (e) {
    console.error("Auth register error:", e);
    res.status(500).json({ error: e.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Missing fields" });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    const tokens = generate(user);
    res.cookie("accessToken", tokens.access, cookieOptions(15 * 60 * 1000));
    res.cookie(
      "refreshToken",
      tokens.refresh,
      cookieOptions(7 * 24 * 60 * 60 * 1000),
    );

    const safeUser = { id: user._id, name: user.name, email: user.email };
    res.json({ ok: true, user: safeUser });
  } catch (e) {
    console.error("Auth login error:", e);
    res.status(500).json({ error: e.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: "No refresh token" });
    const { verifyRefresh } = require("../utils/generateTokens");
    let payload;
    try {
      payload = verifyRefresh(token);
    } catch (e) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // emit new tokens (rotation) - stateless (no server storage)
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const tokens = generate(user);
    res.cookie("accessToken", tokens.access, cookieOptions(15 * 60 * 1000));
    res.cookie(
      "refreshToken",
      tokens.refresh,
      cookieOptions(7 * 24 * 60 * 60 * 1000),
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("Auth refresh error:", e);
    res.status(500).json({ error: e.message });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
  res.json({ ok: true });
};

exports.me = async (req, res) => {
  try {
    const User = require("../models/User");
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    const safeUser = { id: user._id, name: user.name, email: user.email };
    res.json({ ok: true, user: safeUser });
  } catch (e) {
    console.error("Auth me error:", e);
    res.status(500).json({ error: e.message });
  }
};
