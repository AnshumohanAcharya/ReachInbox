# Automated Email Response Tool

This project automates email processing using Gmail and Outlook via OAuth authentication, analyzes email content using OpenAI, categorizes emails, and sends appropriate replies. 

## Technologies Used
- **OAuth Authentication**: Gmail and Outlook
- **OpenAI**: For analyzing email content and generating responses
- **Drizzle ORM**: For database interaction
- **PostgreSQL**: Database storage
- **Node.js & Express.js**: Backend server
- **Gemini API**: For integration (if applicable)
- **pnpm**: Package manager for dependencies

## Features
1. **OAuth Authentication for Gmail & Outlook**
2. **Email Analysis with OpenAI to Understand Context**
3. **Automatic Email Categorization (Interested, Not Interested, More Information)**
4. **Automated Email Replies Based on Context**
5. **Fully Automated Workflow (No Manual Endpoint Triggers)**

---

## Local Setup

### Prerequisites
- **Node.js** and **pnpm** must be installed on your local machine.
  - Install Node.js from [here](https://nodejs.org/)
  - Install pnpm: `npm install -g pnpm`
  
- **PostgreSQL** must be installed and running on your local machine.
  - Download and install PostgreSQL from [here](https://www.postgresql.org/download/)

- **Gmail API** and **Outlook API** credentials should be set up.
  - [Gmail OAuth Setup Guide](https://developers.google.com/gmail/api/quickstart)
  - [Outlook OAuth Setup Guide](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)

### Installation Steps

1. **Clone the repository**:
    ```bash
    git clone https://github.com/AnshumohanAcharya/ReachInbox.git
    cd ReachInbox
    ```

2. **Install dependencies** using pnpm:
    ```bash
    pnpm install
    ```

3. **Set up environment variables**:
    Create a `.env` file in the root of the project with the following environment variables:

    ```
    GMAIL_CLIENT_ID=<your-gmail-client-id>
    GMAIL_CLIENT_SECRET=<your-gmail-client-secret>
    OUTLOOK_CLIENT_ID=<your-outlook-client-id>
    OUTLOOK_CLIENT_SECRET=<your-outlook-client-secret>
    GEMINI_API_KEY=<your-openai-api-key>
    DATABASE_URL=postgresql://<username>:<password>@localhost:5432/<database_name>
    ```

4. **Set up PostgreSQL**:
    - Create a database in PostgreSQL.
    - Use Drizzle ORM for database interaction. Ensure the database schema is set up correctly based on the model.

    ```bash
    pnpm run migrate:setup
    ```

5. **Run the application**:
    ```bash
    pnpm run dev
    ```

6. **Access the web page**:
    Open your browser and go to [http://localhost:3000](http://localhost:3000) to access the tool.

### Demo Setup

1. **OAuth Integration for Gmail & Outlook**:
    - During the review demo, the panel can connect new email accounts using OAuth for Gmail and Outlook.
    - Both Google and Outlook accounts will authenticate via their OAuth consent screens.

2. **Send Test Emails**:
    - Send an email to the connected Gmail or Outlook account from a different account.
  
3. **Email Categorization**:
    - The tool will read incoming emails, analyze the content using OpenAI, and categorize them into one of three labels:
      - **Interested**
      - **Not Interested**
      - **More Information**

4. **Automated Reply Generation**:
    - Based on the email content, the tool will suggest an appropriate response. For instance, if the email indicates interest in more details, the tool will respond asking for a demo call, suggesting available time slots.

5. **Automated Workflow**:
    - The entire process, from reading incoming emails to sending replies, is fully automated. No manual intervention is needed to trigger these actions.

---

## Challenges Faced

1. **OAuth Authentication**:
    - Handling OAuth flow for both Gmail and Outlook required careful management of tokens and refresh tokens to avoid session expiration.
    - Dealing with Gmail's stricter OAuth scopes and handling user permissions properly was challenging.
  
2. **Email Categorization with OpenAI**:
    - OpenAI's API was used to analyze email content, which required fine-tuning prompts to ensure accurate categorization and meaningful responses.
    - Handling edge cases in email content that did not fit into the predefined categories was a challenge.
  
3. **Database Integration**:
    - Setting up Drizzle ORM with PostgreSQL and ensuring proper synchronization between the app and database schema required thorough testing.

4. **Email Sending & Automation**:
    - Implementing automated replies based on categorized emails, ensuring the response was contextually accurate, required fine-tuning of AI-generated content.

---

## Additional Information

- **Database Design**:
    The application stores user authentication tokens, email logs, and categorization data in PostgreSQL using Drizzle ORM. The schema includes tables for storing user information, email metadata, content analysis results, and responses.

- **Automation**:
    The entire email processing workflow is automated, from receiving emails to sending replies. The tool uses scheduled cron jobs to check for new emails periodically, analyze them, categorize them, and send replies.

- **Error Handling**:
    Proper error handling has been implemented, especially for API failures (Gmail, Outlook, OpenAI) and database connection issues.

---

## Conclusion

This project demonstrates an automated email response system capable of authenticating users via Gmail and Outlook, analyzing emails with Gemini AI, categorizing them, and sending context-aware replies. The tool ensures minimal manual intervention, offering a smooth automation process for email management.

For any additional questions or setup issues, feel free to open an issue in the repository.

---
