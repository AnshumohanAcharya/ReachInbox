import { GoogleGenerativeAI } from "@google/generative-ai";
import { ProcessedEmail } from "../types";

export class AIService {
    private static instance: AIService;
    private genAI: GoogleGenerativeAI;
    private model: string = "gemini-1.5-flash";

    private constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    }

    static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    async analyzeEmail(email: ProcessedEmail): Promise<{
        label: string;
        suggestedResponse: string;
    }> {
        try {
            const model = this.genAI.getGenerativeModel({ model: this.model });

            const prompt = `
        Analyze this email and categorize it into one of these labels: 
        "Interested", "Not Interested", "More Information"
        
        Also suggest an appropriate response based on the category.
        
        Email Subject: ${email.subject}
        Email Content: ${email.content}
        
        Return the response in this format:
        Label: [label]
        Response: [suggested response]
        
        Make the response professional and contextual.
      `;

            const result = await model.generateContent(prompt);
            const response = result.response.text();
            const [labelLine, responseLine] = response.split("\n");

            return {
                label: labelLine.replace("Label:", "").trim(),
                suggestedResponse: responseLine.replace("Response:", "").trim(),
            };
        } catch (error) {
            console.error("Error analyzing email:", error);
            throw new Error("Failed to analyze email");
        }
    }

    async generateResponse(
        email: ProcessedEmail,
        label: string
    ): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({ model: this.model });
            let responsePrompt = "";

            switch (label) {
                case "Interested":
                    responsePrompt = `
            Generate a warm, professional response for an interested prospect.
            Include a suggestion for a demo call next week.
            Reference their specific interests from: ${email.content}
          `;
                    break;
                case "Not Interested":
                    responsePrompt = `
            Generate a polite, brief response acknowledging their decision.
            Keep the door open for future opportunities.
            Base it on their feedback: ${email.content}
          `;
                    break;
                case "More Information":
                    responsePrompt = `
            Generate a detailed response addressing their questions.
            Reference specific points from: ${email.content}
            Include relevant information and next steps.
          `;
                    break;
            }

            const result = await model.generateContent(responsePrompt);
            return result.response.text();
        } catch (error) {
            console.error("Error generating response:", error);
            throw new Error("Failed to generate response");
        }
    }
}
