require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const socket = require("./socket");

const port = process.env.PORT || 4000;

(async () => {
  try {
    await connectDB();
  } catch (e) {
    console.error("Failed to connect to DB:", e);
    process.exit(1);
  }

  const server = http.createServer(app);
  // initialize socket.io
  socket.init(server);

  let currentPort = Number(port) || 4000;
  const maxAttempts = 5;
  let attempts = 0;

  function tryListen(p) {
    server.listen(p, () => {
      const addr = server.address();
      const actualPort = addr && addr.port ? addr.port : p;
      console.log(`Server listening on ${actualPort}`);
      if (actualPort !== Number(process.env.PORT || 4000)) {
        console.log(
          `(requested port ${process.env.PORT || 4000} unavailable — using ${actualPort})`,
        );
      }
    });
  }

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      if (attempts < maxAttempts) {
        console.warn(
          `Port ${currentPort} in use, trying ${currentPort + 1}...`,
        );
        attempts += 1;
        currentPort += 1;
        setTimeout(() => tryListen(currentPort), 250);
        return;
      }
      console.warn(
        `Ports ${port}-${currentPort} unavailable; falling back to an ephemeral port`,
      );
      // try ephemeral port assigned by OS
      tryListen(0);
      return;
    }
    console.error("Server error:", err);
    process.exit(1);
  });

  tryListen(currentPort);
})();

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
