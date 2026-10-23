import type { Server } from "node:http";
import app from "./app";
import { envVars } from "./app/config/env";
import { prisma } from "./app/lib/prisma";
import { seedSuperAdmin } from "./app/utils/seed";

const shutdownTimeoutMs = 10_000;

let server: Server | undefined;
let isShuttingDown = false;
let isListening = false;

let shutdownTimer: ReturnType<typeof setTimeout> | undefined;

const forceShutdown = (reason: string): never => {
  console.error(reason);
  server?.closeAllConnections();
  process.exit(1);
};

const shutdown = async (
  reason: string,
  exitCode = 0,
  error?: unknown,
): Promise<void> => {
  if (isShuttingDown) {
    forceShutdown(`Shutdown already in progress. Received ${reason}.`);
  }

  isShuttingDown = true;

  console.log(`Shutting down: ${reason}`);

  if (error !== undefined) {
    console.error("Error details:", error);
  }

  shutdownTimer = setTimeout(() => {
    forceShutdown("Graceful shutdown timed out; forcing exit.");
  }, shutdownTimeoutMs);

  let finalExitCode = exitCode;

  try {
    if (server && isListening) {
      const currentServer = server;
      isListening = false;

      await new Promise<void>((resolve, reject) => {
        currentServer.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });

        currentServer.closeIdleConnections();
      });

      console.log("HTTP server closed.");
    }
  } catch (err) {
    finalExitCode = 1;
    console.error("Failed to close HTTP server:", err);
    server?.closeAllConnections();
  }

  try {
    await prisma.$disconnect();
    console.log("Prisma disconnected successfully.");
  } catch (err) {
    finalExitCode = 1;
    console.error("Failed to disconnect Prisma:", err);
  }

  if (shutdownTimer) {
    clearTimeout(shutdownTimer);
  }

  console.log("Shutdown completed.");
  process.exitCode = finalExitCode;
};

const startServer = async (): Promise<void> => {
  try {
    await seedSuperAdmin();

    if (isShuttingDown) {
      return;
    }

    server = app.listen(envVars.PORT, () => {
      isListening = true;
      console.log(`Server is running on http://localhost:${envVars.PORT}`);
    });

    server.on("error", (error: Error) => {
      void shutdown("HTTP server error", 1, error);
    });
  } catch (error) {
    await shutdown("Startup failed", 1, error);
  }
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("unhandledRejection", (reason: unknown) => {
  void shutdown("Unhandled rejection", 1, reason);
});

process.on("uncaughtException", (error: Error) => {
  void shutdown("Uncaught exception", 1, error);
});

void startServer();
