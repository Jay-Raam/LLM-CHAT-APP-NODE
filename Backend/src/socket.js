const { Server } = require("socket.io");

let io;

function init(server) {
  const FRONTEND_ORIGIN =
    process.env.FRONTEND_ORIGIN || "http://localhost:5173";
  const corsOptions =
    process.env.NODE_ENV === "production"
      ? { origin: FRONTEND_ORIGIN, credentials: true }
      : { origin: true, credentials: true }; // allow all origins in dev for easier debugging

  console.log("FRONTEND_ORIGIN", FRONTEND_ORIGIN);
  console.log("corsOptions", corsOptions);

  io = new Server(server, {
    cors: corsOptions,
  });

  io.on("connection", (socket) => {
    console.log("Socket.IO client connected", socket.id);
    try {
      console.log("Socket handshake headers:", socket.handshake.headers);
      console.log("Socket handshake query:", socket.handshake.query);
      // log cookies if present
      if (socket.handshake.headers && socket.handshake.headers.cookie) {
        console.log(
          "Socket handshake cookies:",
          socket.handshake.headers.cookie,
        );
      }
    } catch (e) {
      console.warn("Failed to log handshake details", e.message || e);
    }

    socket.on("disconnect", (reason) =>
      console.log(
        "Socket.IO client disconnected",
        socket.id,
        "reason:",
        reason,
      ),
    );
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

module.exports = { init, getIO };
