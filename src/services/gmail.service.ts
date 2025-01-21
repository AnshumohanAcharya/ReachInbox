import { GoogleGenerativeAI } from "@google/generative-ai";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { eq } from "drizzle-orm";
import { config } from 'dotenv';
import { db, emailAccounts, processedEmails } from "../config/db";
import { ProcessedEmail } from "../types";

// Gmail label IDs - these will be populated when labels are created/fetched
interface GmailLabels {
  INTERESTED: string;
  NOT_INTERESTED: string;
  MORE_INFORMATION: string;
}

export class GmailService {
    private static instance: GmailService;
    private oauth2Client: OAuth2Client;
    private labels: GmailLabels | null = null;

    private constructor() {
        this.oauth2Client = new OAuth2Client({
            clientId: process.env.GMAIL_CLIENT_ID,
            clientSecret: process.env.GMAIL_CLIENT_SECRET,
        });
    }

    static getInstance(): GmailService {
        if (!GmailService.instance) {
            GmailService.instance = new GmailService();
        }
        return GmailService.instance;
    }

    private async getGmailClient(accessToken: string) {
        this.oauth2Client.setCredentials({ access_token: accessToken });
        return google.gmail({ version: "v1", auth: this.oauth2Client });
    }

    private async ensureLabelsExist(gmail: any) {
        try {
            // Get all existing labels
            const response = await gmail.users.labels.list({ userId: 'me' });
            const existingLabels = response.data.labels || [];

            // Define our required labels
            const requiredLabels = [
                { name: 'Interested', labelListVisibility: 'labelShow' },
                { name: 'Not Interested', labelListVisibility: 'labelShow' },
                { name: 'More Information', labelListVisibility: 'labelShow' }
            ];

            const labels: GmailLabels = {
                INTERESTED: '',
                NOT_INTERESTED: '',
                MORE_INFORMATION: ''
            };

            // Create or get existing labels
            for (const label of requiredLabels) {
                const existingLabel = existingLabels.find((l: { name: string }) => l.name === label.name);
                
                if (existingLabel) {
                    // Use existing label
                    labels[label.name.toUpperCase().replace(' ', '_') as keyof GmailLabels] = existingLabel.id;
                } else {
                    // Create new label
                    const created = await gmail.users.labels.create({
                        userId: 'me',
                        requestBody: {
                            name: label.name,
                            labelListVisibility: label.labelListVisibility,
                            messageListVisibility: 'show'
                        }
                    });
                    labels[label.name.toUpperCase().replace(' ', '_') as keyof GmailLabels] = created.data.id;
                }
            }

            this.labels = labels;
            return labels;
        } catch (error) {
            console.error('Error ensuring labels exist:', error);
            throw error;
        }
    }

    async attachLabelToEmail(accountId: string, messageId: string, labelName: string) {
        try {
            const account = await db
                .select()
                .from(emailAccounts)
                .where(eq(emailAccounts.id, accountId))
                .limit(1)
                .execute();

            if (!account.length) {
                throw new Error("Account not found");
            }

            const gmail = await this.getGmailClient(account[0].accessToken);
            
            // Ensure labels exist and get label IDs
            const labels = await this.ensureLabelsExist(gmail);
            
            // Convert labelName to the corresponding label ID
            const labelKey = labelName.toUpperCase().replace(' ', '_') as keyof GmailLabels;
            const labelId = labels[labelKey];
            
            if (!labelId) {
                throw new Error(`Label ID not found for ${labelName}`);
            }

            // Modify the message to add the label
            await gmail.users.messages.modify({
                userId: 'me',
                id: messageId,
                requestBody: {
                    addLabelIds: [labelId],
                }
            });

            console.log(`Label ${labelName} (ID: ${labelId}) added to email ${messageId}`);
            return true;
        } catch (error) {
            console.error("Error attaching label to email:", error);
            throw error;
        }
    }

    async sendReply(accountId: string, messageId: string, replyContent: string) {
        try {
            const account = await db
                .select()
                .from(emailAccounts)
                .where(eq(emailAccounts.id, accountId))
                .limit(1)
                .execute();

            if (!account.length) {
                throw new Error("Account not found");
            }

            const gmail = await this.getGmailClient(account[0].accessToken);

            // Get the original message to reply to
            const originalMessage = await gmail.users.messages.get({
                userId: 'me',
                id: messageId,
            });

            const headers = originalMessage.data.payload?.headers;
            const to = headers?.find(h => h.name === "From")?.value;
            const subject = headers?.find(h => h.name === "Subject")?.value;
            const references = headers?.find(h => h.name === "Message-ID")?.value;

            // Construct email with proper headers for threading
            const email = [
                'Content-Type: text/plain; charset="UTF-8"\n',
                'MIME-Version: 1.0\n',
                'Content-Transfer-Encoding: 7bit\n',
                `To: ${to}\n`,
                `Subject: Re: ${subject}\n`,
                `References: ${references}\n`,
                `In-Reply-To: ${references}\n\n`,
                replyContent
            ].join('');

            const encodedEmail = Buffer.from(email)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedEmail,
                    threadId: originalMessage.data.threadId
                }
            });

            return true;
        } catch (error) {
            console.error("Error sending reply:", error);
            throw error;
        }
    }
    
    async fetchEmails(accountId: string, maxResults: number = 4) {
        try {
            const account = await db
                .select()
                .from(emailAccounts)
                .where(eq(emailAccounts.id, accountId))
                .limit(1)
                .execute();

            if (!account.length) {
                throw new Error("Account not found");
            }

            const gmail = await this.getGmailClient(account[0].accessToken);

            const response = await gmail.users.messages.list({
                userId: "me",
                maxResults: maxResults,
                q: "is:unread",
            });

            const emails = [];

            for (const message of response.data.messages || []) {
                const email = await gmail.users.messages.get({
                    userId: "me",
                    id: message.id!,
                    format: "full",
                });

                const headers = email.data.payload?.headers;
                const subject =
                    headers?.find((h) => h.name === "Subject")?.value || "";
                const from =
                    headers?.find((h) => h.name === "From")?.value || "";
                const content = this.extractEmailContent(email.data);

                const processedEmail: ProcessedEmail = {
                    id: email.data.id!,
                    accountId,
                    subject,
                    content,
                    from,
                    labelId: "", // Will be set by AI service
                    processed: false,
                    createdAt: new Date(),
                };

                emails.push(processedEmail);
            }

            return emails;
        } catch (error) {
            console.error("Error fetching emails:", error);
            throw new Error("Failed to fetch emails");
        }
    }

    private extractEmailContent(message: any): string {
        let content = "";

        if (message.payload?.body?.data) {
            content = Buffer.from(
                message.payload.body.data,
                "base64"
            ).toString();
        } else if (message.payload?.parts) {
            for (const part of message.payload.parts) {
                if (part.mimeType === "text/plain" && part.body?.data) {
                    content += Buffer.from(part.body.data, "base64").toString();
                }
            }
        }

        return content;
    }

    // async sendReply(
    //     accountId: string,
    //     messageId: string,
    //     replyContent: string
    // ) {
    //     try {
    //         const account = await db
    //             .select()
    //             .from(emailAccounts)
    //             .where(eq(emailAccounts.id, accountId))
    //             .limit(1)
    //             .execute();

    //         if (!account) {
    //             throw new Error("Account not found");
    //         }

    //         const gmail = await this.getGmailClient(account[0].accessToken);

    //         const originalMessage = await gmail.users.messages.get({
    //             userId: "me",
    //             id: messageId,
    //         });

    //         const headers = originalMessage.data.payload?.headers;
    //         const to = headers?.find((h) => h.name === "From")?.value;
    //         const subject = headers?.find((h) => h.name === "Subject")?.value;

    //         const email = [
    //             'Content-Type: text/plain; charset="UTF-8"\n',
    //             "MIME-Version: 1.0\n",
    //             "Content-Transfer-Encoding: 7bit\n",
    //             `To: ${to}\n`,
    //             `Subject: Re: ${subject}\n\n`,
    //             replyContent,
    //         ].join("");

    //         const encodedEmail = Buffer.from(email)
    //             .toString("base64")
    //             .replace(/\+/g, "-")
    //             .replace(/\//g, "_");

    //         await gmail.users.messages.send({
    //             userId: "me",
    //             requestBody: {
    //                 raw: encodedEmail,
    //                 threadId: originalMessage.data.threadId,
    //             },
    //         });

    //         return true;
    //     } catch (error) {
    //         console.error("Error sending reply:", error);
    //         throw new Error("Failed to send reply");
    //     }
    // }
}
