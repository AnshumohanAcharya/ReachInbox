import express from "express";
import { EmailProcessor } from "../services/email.processor";

const router = express.Router();
const emailProcessor = EmailProcessor.getInstance();

router.post("/:accountId", async (req, res) => {
    try {
        const { accountId } = req.params;
        await emailProcessor.processNewEmails(accountId);
        res.json({ success: true });
    } catch (error) {
        console.error("Error processing emails:", error);
        res.status(500).json({ error: "Failed to process emails" });
    }
});

export default router;
