import express from "express";
import { AuthService } from "../services/auth.service";

const router = express.Router();
const authService = AuthService.getInstance();

router.get("/gmail", async (req, res) => {
    try {
        const authUrl = await authService.getGmailAuthUrl();
        console.log("Generated Auth URL:", authUrl); // For debugging
        res.json({ url: authUrl });
    } catch (error) {
        console.error("Gmail auth error:", error);
        res.status(500).json({
            error: "Failed to initiate Gmail authentication",
        });
    }
});

router.get("/gmail/callback", async (req, res) => {
    try {
        const { code } = req.query;
        if (!code || typeof code !== "string") {
            throw new Error("Invalid auth code");
        }

        const account = await authService.handleGmailCallback(code);
        res.redirect(
            `/dashboard?success=true&provider=gmail&email=${account.email}`
        );
    } catch (error) {
        console.error("Gmail callback error:", error);
        res.redirect("/dashboard?error=gmail_auth_failed");
    }
});

router.get("/outlook", async (req, res) => {
    try {
        const authUrl = await AuthService.getOutlookAuthUrl();
        res.redirect(authUrl);
    } catch (error) {
        console.error("Outlook auth error:", error);
        res.status(500).json({
            error: "Failed to initiate Outlook authentication",
        });
    }
});

/**
 * @swagger
 * /auth/outlook/callback:
 *   get:
 *     summary: Handle Outlook authentication callback
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Authorization code from Outlook
 *     responses:
 *       302:
 *         description: Redirect to dashboard with success or error message
 */

router.get("/outlook/callback", async (req, res) => {
    try {
        const { code } = req.query;
        if (!code || typeof code !== "string") {
            throw new Error("Invalid auth code");
        }

        const account = await authService.handleOutlookCallback(code);
        res.redirect(
            `/dashboard?success=true&provider=outlook&email=${account.email}`
        );
    } catch (error) {
        console.error("Outlook callback error:", error);
        res.redirect("/dashboard?error=outlook_auth_failed");
    }
});

export default router;
