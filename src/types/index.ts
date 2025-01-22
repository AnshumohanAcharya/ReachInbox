export interface EmailAccount {
    id: string;
    provider: "gmail" | "outlook";
    email: string;
    accessToken: string;
    refreshToken: string;
    requiresReauth: boolean;
    expiresAt: Date;
}

export interface EmailLabel {
    id: string;
    name: "Interested" | "Not Interested" | "More Information";
    color?: string;
}

export interface ProcessedEmail {
    id: string;
    accountId: string;
    subject: string;
    content: string;
    from: string;
    labelId: string;
    suggestedResponse?: string;
    processed: boolean;
    createdAt: Date;
}
