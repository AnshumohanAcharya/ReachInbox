const swaggerDocument = {
    openapi: "3.0.0",
    info: {
        title: "Email Automation Tool API",
        version: "1.0.0",
        description: "API documentation for the email automation tool.",
    },
    paths: {
        "/auth/gmail": {
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
        "/auth/gmail/callback": {
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
        "/auth/outlook": {
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
        "/auth/outlook/callback": {
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
    },
};

export default swaggerDocument;
