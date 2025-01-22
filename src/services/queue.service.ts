// src/services/queue.service.ts
import { Queue, Worker } from "bullmq";
import { eq } from "drizzle-orm";
import Redis from "ioredis";
import { db, emailAccounts } from "../config/db";
import { EmailProcessor } from "./email.processor";

export class QueueService {
    private static instance: QueueService;
    private emailQueue: Queue;
    private worker: Worker;
    private redisConnection: Redis;

    private constructor() {
        this.redisConnection = new Redis(
            process.env.REDIS_URL || "redis://localhost:6379",
            {
                maxRetriesPerRequest: null,
            }
        );

        this.emailQueue = new Queue("email-processing", {
            connection: this.redisConnection,
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: false,
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 1000,
                },
            },
        });

        this.worker = new Worker(
            "email-processing",
            async (job) => {
                const { accountId } = job.data;
                const emailProcessor = EmailProcessor.getInstance();
                await emailProcessor.processNewEmails(accountId);
            },
            { connection: this.redisConnection }
        );

        this.setupWorkerListeners();
        this.setupCleanup();
    }

    private setupWorkerListeners() {
        this.worker.on("failed", async (job, err) => {
            console.error(`Job ${job?.id} failed with error:`, err);

            if (job) {
                const { accountId } = job.data;
                try {
                    if (
                        err.message.includes("invalid_grant") ||
                        err.message.includes("token expired")
                    ) {
                        await db
                            .update(emailAccounts)
                            .set({ requiresReauth: true })
                            .where(eq(emailAccounts.id, accountId));

                        await this.removeAccountFromProcessing(accountId);
                    }
                } catch (updateError) {
                    console.error(
                        "Error updating account status:",
                        updateError
                    );
                }
            }
        });

        this.worker.on("completed", (job) => {
            console.log(`Job ${job.id} completed successfully`);
        });
    }

    private setupCleanup() {
        setInterval(async () => {
            try {
                await this.emailQueue.clean(1000 * 60 * 60 * 24, 0);
                await this.emailQueue.clean(1000 * 60 * 60 * 24 * 7, 1);
            } catch (error) {
                console.error("Error cleaning up jobs:", error);
            }
        }, 1000 * 60 * 60 * 12);
    }

    static getInstance(): QueueService {
        if (!QueueService.instance) {
            QueueService.instance = new QueueService();
        }
        return QueueService.instance;
    }

    async initializeEmailProcessing() {
        try {
            const accounts = await db
                .select()
                .from(emailAccounts)
                .where(eq(emailAccounts.requiresReauth, false))
                .execute();

            for (const account of accounts) {
                await this.addAccountToProcessing(account.id);
            }
        } catch (error) {
            console.error("Error initializing email processing:", error);
        }
    }

    async addAccountToProcessing(accountId: string) {
        try {
            const repeatableJobs = await this.emailQueue.getRepeatableJobs();
            const existingJob = repeatableJobs.find(
                (job) => job.name === `process-emails-${accountId}`
            );

            if (!existingJob) {
                await this.emailQueue.add(
                    `process-emails-${accountId}`,
                    { accountId },
                    {
                        repeat: {
                            pattern: "*/5 * * * *",
                            immediately: true,
                        },
                    }
                );
                console.log(`Added account ${accountId} to processing queue`);
            }
        } catch (error) {
            console.error(
                `Error adding account ${accountId} to processing:`,
                error
            );
            throw error;
        }
    }

    async removeAccountFromProcessing(accountId: string) {
        try {
            const repeatableJobs = await this.emailQueue.getRepeatableJobs();
            const job = repeatableJobs.find(
                (job) => job.name === `process-emails-${accountId}`
            );

            if (job) {
                await this.emailQueue.removeRepeatableByKey(job.key);
                console.log(
                    `Removed account ${accountId} from processing queue`
                );
            }
        } catch (error) {
            console.error(
                `Error removing account ${accountId} from processing:`,
                error
            );
            throw error;
        }
    }

    async shutdown() {
        console.log("Shutting down queue service...");
        await this.worker.close();
        await this.emailQueue.close();
        await this.redisConnection.quit();
    }
}
