import * as z from "zod";
import dotenv from "dotenv";

dotenv.config();

/**********************************
 * Helpers
 **********************************/
const requiredString = (name: string) =>
  z
    .string({
      error: `${name} is missing in .env`,
    })
    .trim()
    .min(1, `${name} cannot be empty`);


/**********************************
 * Schema
 **********************************/
const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  BCRYPT_SALT_ROUND: z.coerce.number().default(10),
  DATABASE_URL: requiredString("DATABASE_URL"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  BETTER_AUTH_URL: requiredString("BETTER_AUTH_URL"),
  BETTER_AUTH_SECRET: requiredString("BETTER_AUTH_SECRET"),

  JWT_ACCESS_SECRET: requiredString("JWT_ACCESS_SECRET"),
  JWT_ACCESS_EXPIRES: requiredString("JWT_ACCESS_EXPIRES"),
  JWT_REFRESH_SECRET: requiredString("JWT_REFRESH_SECRET"),
  JWT_REFRESH_EXPIRES: requiredString("JWT_REFRESH_EXPIRES"),
  JWT_RESET_SECRET: requiredString("JWT_RESET_SECRET"),

  EXPRESS_SESSION_SECRET: requiredString("EXPRESS_SESSION_SECRET"),

  CLOUDINARY_CLOUD_NAME: requiredString("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY: requiredString("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: requiredString("CLOUDINARY_API_SECRET"),
  
  SUPER_ADMIN_EMAIL: requiredString("SUPER_ADMIN_EMAIL"),
  SUPER_ADMIN_PASS: requiredString("SUPER_ADMIN_PASS"),
  
  SMTP_PORT: z.coerce.number(),
  SMTP_FROM: requiredString("SMTP_FROM"),
  SMTP_HOST: requiredString("SMTP_HOST"),
  SMTP_USER: requiredString("SMTP_USER"),
  SMTP_PASS: requiredString("SMTP_PASS"),

  FRONTEND_URL: requiredString("FRONTEND_URL"),


});

/**********************************
 *    Parse and Export
 **********************************/
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("\n Invalid environment variables: \n");
    for (const issue of result.error.issues) {
      console.error(`● ${issue.path.join(".")}: ${issue.message}`);
    }
    throw new Error("Environment validation failed");
  }

  const env = result.data;

  return Object.freeze({
    DATABASE_URL: env.DATABASE_URL,
    PORT: env.PORT,
    NODE_ENV: env.NODE_ENV,
    BCRYPT_SALT_ROUND: env.BCRYPT_SALT_ROUND,

    JWT_ACCESS_SECRET: env.JWT_ACCESS_SECRET,
    JWT_ACCESS_EXPIRES: env.JWT_ACCESS_EXPIRES,
    JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES: env.JWT_REFRESH_EXPIRES,
    JWT_RESET_SECRET: env.JWT_RESET_SECRET,

    BETTER_AUTH_URL: env.BETTER_AUTH_URL,
    BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,

    EXPRESS_SESSION_SECRET: env.EXPRESS_SESSION_SECRET,

    CLOUDINARY_CLOUD_NAME: env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: env.CLOUDINARY_API_SECRET,

    SUPER_ADMIN_EMAIL: env.SUPER_ADMIN_EMAIL,
    SUPER_ADMIN_PASS: env.SUPER_ADMIN_PASS,
    
    SMTP_PORT: env.SMTP_PORT,
    SMTP_HOST: env.SMTP_HOST,
    SMTP_FROM: env.SMTP_FROM,
    SMTP_USER: env.SMTP_USER,
    SMTP_PASS: env.SMTP_PASS,

    FRONTEND_URL: env.FRONTEND_URL,
    
  });
};
export const envVars = parseEnv();
