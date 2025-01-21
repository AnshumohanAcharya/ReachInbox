import { eq } from "drizzle-orm";
import { db, processedEmails } from "../config/db";
import { AIService } from "./ai.service";
import { GmailService } from "./gmail.service";

export class EmailProcessor {
    private static instance: EmailProcessor;
    private gmailService: GmailService;
    private aiService: AIService;

    private constructor() {
        this.gmailService = GmailService.getInstance();
        this.aiService = AIService.getInstance();
    }

    static getInstance(): EmailProcessor {
        if (!EmailProcessor.instance) {
            EmailProcessor.instance = new EmailProcessor();
        }
        return EmailProcessor.instance;
    }

    async processNewEmails(accountId: string) {
        try {
            console.log(`Starting email processing for account: ${accountId}`);

            const emails = await this.gmailService.fetchEmails(accountId);
            console.log(
                `Fetched ${emails.length} emails for account: ${accountId}`
            );

            for (const email of emails) {
                console.log(`Processing email: ${email.id}`);

                const existing = await db
                    .select()
                    .from(processedEmails)
                    .where(eq(processedEmails.id, email.id))
                    .limit(1)
                    .execute();

                if (existing.length) {
                    console.log(`Email ${email.id} is already processed.`);
                    continue;
                }

                const analysis = await this.aiService.analyzeEmail(email);
                console.log("Analysis result:", analysis);

                // Attach the label in Gmail
                await this.gmailService.attachLabelToEmail(
                    accountId,
                    email.id,
                    analysis.label
                );
                console.log(`Label ${analysis.label} attached to email ${email.id}.`);

                const response = await this.aiService.generateResponse(
                    email,
                    analysis.label
                );
                console.log(
                    `Generated response for email ${email.id}:`,
                    response
                );

                await db.insert(processedEmails).values({
                    ...email,
                    labelId: analysis.label,
                    suggestedResponse: response,
                    processed: false,
                });
                console.log(`Email ${email.id} saved to database.`);

                // Attach the label to the email
                const labelName = analysis.label; // Assuming the label is the label ID
                await this.gmailService.attachLabelToEmail(
                    accountId,
                    email.id,
                    labelName
                );
                console.log(`Label ${labelName} attached to email ${email.id}.`);

                // Send the generated response
                await this.gmailService.sendReply(
                    accountId,
                    email.id,
                    response
                );
                console.log(`Reply sent for email ${email.id}.`);
            }
        } catch (error) {
            console.error("Error processing emails:", error);
            throw new Error("Failed to process emails");
        }
    }
}
