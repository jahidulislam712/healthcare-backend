import app from "./app";
import { envVars } from "./app/config/env";
import { prisma } from "./app/lib/prisma";

const shutdownTimeoutMs = 10_000;
const server = app.listen(envVars.PORT, () => {
  console.log(`Server is running on http://localhost:${envVars.PORT}`);
});

let isShuttingDown = false;

const shutdown = (signal: NodeJS.Signals) => {
  if (isShuttingDown) {
    console.error(`Received ${signal} during shutdown; forcing process exit.`);
    server.closeAllConnections();
    process.exit(1);
  }

  isShuttingDown = true;
  console.log(`Received ${signal}; shutting down gracefully.`);

  const shutdownTimer = setTimeout(() => {
    console.error("Graceful shutdown timed out; forcing process exit.");
    server.closeAllConnections();
    process.exit(1);
  }, shutdownTimeoutMs);

  server.close((serverError) => {
    if (serverError) {
      console.error("Failed to close HTTP server cleanly:", serverError);
    }

    void prisma
      .$disconnect()
      .then(() => {
        clearTimeout(shutdownTimer);
        if (serverError) {
          process.exitCode = 1;
          return;
        }

        console.log("HTTP server and Prisma client shut down cleanly.");
        process.exitCode = 0;
      })
      .catch((error: unknown) => {
        clearTimeout(shutdownTimer);
        console.error("Failed to disconnect Prisma during shutdown:", error);
        process.exitCode = 1;
      });
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

server.on("error", (error: Error) => {
  console.error("HTTP server failed:", error);
  process.exitCode = 1;
});
