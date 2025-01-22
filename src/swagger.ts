const swaggerDocument = {
    openapi: "3.0.0",
    info: {
        title: "Email Automation Tool API",
        version: "1.0.0",
        description: "API documentation for the email automation tool.",
    },
    paths: {
        "auth/gmail": {
            get: {
                summary: "Initiate Gmail authentication",
                tags: ["Authentication"],
                responses: {
                    302: {
                        description: "Redirect to Gmail authentication URL",
                    },
                    500: {
                        description: "Failed to initiate Gmail authentication",
                    },
                },
            },
        },
        "auth/gmail/callback": {
            get: {
                summary: "Handle Gmail authentication callback",
                tags: ["Authentication"],
                parameters: [
                    {
                        in: "query",
                        name: "code",
                        schema: {
                            type: "string",
                        },
                        required: true,
                        description: "Authorization code from Gmail",
                    },
                ],
                responses: {
                    302: {
                        description:
                            "Redirect to dashboard with success or error message",
                    },
                },
            },
        },
        "auth/outlook": {
            get: {
                summary: "Initiate Outlook authentication",
                tags: ["Authentication"],
                responses: {
                    302: {
                        description: "Redirect to Outlook authentication URL",
                    },
                    500: {
                        description:
                            "Failed to initiate Outlook authentication",
                    },
                },
            },
        },
        "auth/outlook/callback": {
            get: {
                summary: "Handle Outlook authentication callback",
                tags: ["Authentication"],
                parameters: [
                    {
                        in: "query",
                        name: "code",
                        schema: {
                            type: "string",
                        },
                        required: true,
                        description: "Authorization code from Outlook",
                    },
                ],
                responses: {
                    302: {
                        description:
                            "Redirect to dashboard with success or error message",
                    },
                },
            },
        },
        "emails/:accountId": {
            get: {
                summary: "Fetch emails for the specified email account",
                tags: ["Emails"],
                parameters: [
                    {
                        in: "path",
                        name: "accountId",
                        schema: {
                            type: "string",
                        },
                        required: true,
                        description: "ID of the email account",
                    },
                ],
                responses: {
                    200: {
                        description: "List of emails",
                    },
                    500: {
                        description: "Failed to fetch emails",
                    },
                },
            },
        },
        "emails/:accountId/:messageId/reply": {
            post: {
                summary: "Send a reply to the specified email",
                tags: ["Emails"],
                parameters: [
                    {
                        in: "path",
                        name: "accountId",
                        schema: {
                            type: "string",
                        },
                        required: true,
                        description: "ID of the email account",
                    },
                    {
                        in: "path",
                        name: "messageId",
                        schema: {
                            type: "string",
                        },
                        required: true,
                        description: "ID of the email message",
                    },
                ],
                requestBody: {
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    content: {
                                        type: "string",
                                    },
                                },
                                required: ["content"],
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Reply sent successfully",
                    },
                    500: {
                        description: "Failed to send reply",
                    },
                },
            },
        },
        "process/:accountId": {
            post: {
                summary: "Process new emails for the specified email account",
                tags: ["Processing"],
                parameters: [
                    {
                        in: "path",
                        name: "accountId",
                        schema: {
                            type: "string",
                        },
                        required: true,
                        description: "ID of the email account",
                    },
                ],
                responses: {
                    200: {
                        description: "Emails processed successfully",
                    },
                    500: {
                        description: "Failed to process emails",
                    },
                },
            },
        },
    },
};

export default swaggerDocument;
