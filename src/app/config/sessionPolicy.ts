const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_DAY = 24 * 60 * 60;
const MILLISECONDS_PER_SECOND = 1000;

const idleTimeoutSeconds = 7 * SECONDS_PER_DAY;
const absoluteTimeoutSeconds = 30 * SECONDS_PER_DAY;

export const SESSION_POLICY = {
  accessTokenExpiresInSeconds: 30 * SECONDS_PER_MINUTE,
  refreshTokenExpiresInSeconds: absoluteTimeoutSeconds,
  accessTokenCookieMaxAgeMs:
    30 * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND,
  refreshTokenCookieMaxAgeMs:
    absoluteTimeoutSeconds * MILLISECONDS_PER_SECOND,
  idleTimeoutMs: idleTimeoutSeconds * MILLISECONDS_PER_SECOND,
  absoluteTimeoutMs: absoluteTimeoutSeconds * MILLISECONDS_PER_SECOND,
} as const;
