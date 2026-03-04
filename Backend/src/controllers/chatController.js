const Chat = require("../models/Chat");
const { getIO } = require("../socket");

// List chats for the authenticated user
exports.getChats = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const chats = await Chat.find({ participants: userId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    const sessions = chats.map((c) => {
      const last =
        c.messages && c.messages.length
          ? c.messages[c.messages.length - 1]
          : null;
      const title = last ? (last.text || "").slice(0, 60) : "New chat";
      return {
        id: c._id,
        title,
        created_at: c.createdAt,
        updated_at: c.updatedAt,
      };
    });
    res.json(sessions);
  } catch (e) {
    console.error("Get chats error:", e);
    res.status(500).json({ error: e.message });
  }
};

// Get messages for a chat
exports.getChat = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const { id } = req.params;
    const chat = await Chat.findById(id).lean();
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    if (!chat.participants.map(String).includes(String(userId)))
      return res.status(403).json({ error: "Forbidden" });

    const messages = (chat.messages || []).map((m) => ({
      id: m._id,
      role: String(m.sender) === String(userId) ? "user" : "assistant",
      content: m.text,
      created_at: m.createdAt,
    }));
    res.json({ ok: true, messages });
  } catch (e) {
    console.error("Get chat error:", e);
    res.status(500).json({ error: e.message });
  }
};

// Create a message (and optionally a chat session)
exports.createMessage = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const { sessionId, text } = req.body;
    if (!text) return res.status(400).json({ error: "Missing text" });

    let chat;
    if (sessionId) {
      chat = await Chat.findById(sessionId);
      if (!chat) return res.status(404).json({ error: "Chat not found" });
      if (!chat.participants.map(String).includes(String(userId)))
        return res.status(403).json({ error: "Forbidden" });
    } else {
      chat = await Chat.create({ participants: [userId], messages: [] });
    }

    const message = { sender: userId, text };
    chat.messages.push(message);
    await chat.save();

    const outMessage = {
      id: chat.messages[chat.messages.length - 1]._id,
      text,
      sender: "user",
      createdAt: chat.messages[chat.messages.length - 1].createdAt,
      chatId: chat._id,
    };

    // emit to connected clients
    try {
      const io = getIO();
      io.emit("newMessage", outMessage);
    } catch (emitErr) {
      console.warn("Socket emit failed:", emitErr.message || emitErr);
    }

    res.json({ ok: true, chatId: chat._id, message: outMessage });
  } catch (e) {
    console.error("Create message error:", e);
    res.status(500).json({ error: e.message });
  }
};

// Delete a chat session
exports.deleteChat = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const { id } = req.params;
    const deleted = await Chat.findOneAndDelete({
      _id: id,
      participants: userId,
    });
    if (!deleted) return res.status(404).json({ error: "Chat not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("Delete chat error:", e);
    res.status(500).json({ error: e.message });
  }
};
