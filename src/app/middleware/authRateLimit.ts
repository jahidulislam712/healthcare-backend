// src/app/middleware/authRateLimit.ts
import { createHash } from "node:crypto";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisClient } from "../config/redis.config";

const createRedisStore = () =>
  new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  });

export const forgotPasswordIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  store: createRedisStore(),
});

export const forgotPasswordEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  store: createRedisStore(),
  keyGenerator: (req) =>
    createHash("sha256")
      .update(String(req.body.email).trim().toLowerCase())
      .digest("hex"),
});

export const resetPasswordIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  store: createRedisStore(),
});