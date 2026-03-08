const aiService = require("../services/aiService");
const { getIO } = require("../socket");
const Chat = require("../models/Chat");

exports.ask = async (req, res) => {
  try {
    console.log("AI ask endpoint hit - body:", req.body);
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { message, sessionId } = req.body;
    if (!message) return res.status(400).json({ error: "Missing message" });
    const result = await aiService.queryAI(message);

    const content =
      result?.content ||
      result?.rawSecond?.choices?.[0]?.message?.content ||
      result?.rawFirst?.choices?.[0]?.message?.content ||
      "";

    let persistedMessage = null;
    let resolvedChatId = sessionId || null;

    if (content && sessionId) {
      const chat = await Chat.findById(sessionId);
      if (chat && chat.participants.map(String).includes(String(userId))) {
        chat.messages.push({ text: content });
        await chat.save();

        const saved = chat.messages[chat.messages.length - 1];
        persistedMessage = {
          id: saved._id,
          text: saved.text,
          sender: "assistant",
          createdAt: saved.createdAt,
          chatId: chat._id,
        };
        resolvedChatId = String(chat._id);
      }
    }

    // emit the result to connected clients
    try {
      const io = getIO();
      const payload = persistedMessage || {
        id: Date.now().toString(),
        text: content,
        sender: "assistant",
        createdAt: new Date().toISOString(),
        chatId: resolvedChatId,
      };
      io.emit("newMessage", payload);
    } catch (emitErr) {
      console.warn(
        "Socket emit failed (no socket initialized?):",
        emitErr.message,
      );
    }

    res.json({
      ok: true,
      data: result,
      chatId: resolvedChatId,
      message: persistedMessage,
    });
  } catch (e) {
    console.error("AI ask error:", e);
    res.status(e.status || 500).json({ error: e.message || "AI error" });
  }
};
