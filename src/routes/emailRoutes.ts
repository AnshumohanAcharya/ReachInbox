import express from "express";
import { GmailService } from "../services/gmail.service";

const router = express.Router();
const gmailService = GmailService.getInstance();

router.get("/:accountId", async (req, res) => {
    try {
        const { accountId } = req.params;
        const emails = await gmailService.fetchEmails(accountId);
        res.json(emails);
    } catch (error) {
        console.error("Error fetching emails:", error);
        res.status(500).json({ error: "Failed to fetch emails" });
    }
});

router.post("/:accountId/:messageId/reply", async (req, res) => {
    try {
        const { accountId, messageId } = req.params;
        const { content } = req.body;

        await gmailService.sendReply(accountId, messageId, content);
        res.json({ success: true });
    } catch (error) {
        console.error("Error sending reply:", error);
        res.status(500).json({ error: "Failed to send reply" });
    }
});

export default router;
