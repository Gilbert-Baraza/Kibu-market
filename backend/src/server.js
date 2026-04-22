import { createServer } from "http";
import app from "./app.js";
import env from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import { createSocketServer } from "./socket/index.js";

async function startServer() {
  try {
    await connectDatabase(env.mongoUri);

    const httpServer = createServer(app);
    createSocketServer(httpServer);

    httpServer.listen(env.port, () => {
      console.log(`Kibu Market backend running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
