const express = require("express");
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/sessions", authMiddleware, chatController.getChats);
router.post("/messages", authMiddleware, chatController.createMessage);
router.get("/:id", authMiddleware, chatController.getChat);
router.delete("/session/:id", authMiddleware, chatController.deleteChat);

module.exports = router;
