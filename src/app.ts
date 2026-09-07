import express, { Application, Request, Response } from "express";
import { IndexRoutes } from "./app/routes";
import { notFound } from "./app/middleware/notFound";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import cookieParser from "cookie-parser";
import { envVars } from "./app/config/env";
import cors from "cors";

const app: Application = express();

app.use(cors({
    origin : [envVars.FRONTEND_URL, envVars.BETTER_AUTH_URL, "http://localhost:3000", "http://localhost:5000"],
    credentials : true,
    methods : ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders : ["Content-Type", "Authorization"]
}))

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());

app.use(cookieParser())

app.use("/api/v1", IndexRoutes);

// Basic route
app.get('/', async (req: Request, res: Response) => {
    res.status(201).json({
        success: true,
        message: 'API is working'
    })
});

app.use(globalErrorHandler)
app.use(notFound)

export default app;