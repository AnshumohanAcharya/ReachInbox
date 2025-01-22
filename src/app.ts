import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/authRoutes";
import emailRoutes from "./routes/emailRoutes";
import processorRoutes from "./routes/processorRoutes";
import { QueueService } from "./services/queue.service";
import swaggerDocument from "./swagger";

dotenv.config();

const app = express();

// Error handler middleware
const errorHandler = (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
};

async function initializeServer() {
    // Basic middleware setup
    app.use(express.json());
    app.use(
        cors({
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            credentials: true,
        })
    );

    // Initialize queue service
    try {
        console.log("Initializing queue service...");
        const queueService = QueueService.getInstance();
        await queueService.initializeEmailProcessing();
        console.log("Queue service initialized successfully");
    } catch (error) {
        console.error("Failed to initialize queue service:", error);
        throw error; // Prevent server from starting if queue initialization fails
    }

    // Routes
    app.use("/auth", authRoutes);
    app.use("/emails", emailRoutes);
    app.use("/process", processorRoutes);
    app.use("/dashboard", (req, res) => {
        res.send("Welcome to Dashboard!");
    });

    // Swagger UI
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    // Error handling middleware (should be last)
    app.use(errorHandler);

    return app;
}

async function startServer() {
    try {
        const PORT = process.env.PORT || 3000;
        const app = await initializeServer();

        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(
                `Swagger documentation available at http://localhost:${PORT}/api-docs`
            );
        });

        // Graceful shutdown handling
        const gracefulShutdown = async (signal: string) => {
            console.log(`${signal} received. Starting graceful shutdown...`);
            
            // Close server first to stop accepting new requests
            server.close(async () => {
                try {
                    // Shutdown queue service
                    const queueService = QueueService.getInstance();
                    await queueService.shutdown();
                    console.log('Application shutdown successfully');
                    process.exit(0);
                } catch (error) {
                    console.error('Error during shutdown:', error);
                    process.exit(1);
                }
            });

            // Force shutdown after 30 seconds if graceful shutdown fails
            setTimeout(() => {
                console.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 30000);
        };

        // Handle different termination signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught errors
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            gracefulShutdown('Uncaught Exception');
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('Unhandled Rejection');
        });

    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();