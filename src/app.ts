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
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);
const PORT = process.env.PORT || 3000;

app.use(express.json());

async function startApp() {
    // Initialize queue service
    const queueService = QueueService.getInstance();
    await queueService.initializeEmailProcessing();

    // Set up graceful shutdown
    process.on("SIGTERM", async () => {
        await queueService.shutdown();
        process.exit(0);
    });
    app.use("/auth", authRoutes);
    app.use("/emails", emailRoutes);
    app.use("/process", processorRoutes);
    app.use("/dashboard", (req, res) => {
        res.send("Welcome to Dashboard!");
    });

    // Swagger UI
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(
            `Swagger documentation available at http://localhost:${PORT}/api-docs`
        );
    });
}

startApp().catch(console.error);