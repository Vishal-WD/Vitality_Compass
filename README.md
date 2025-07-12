# Vitality Compass

Vitality Compass is a sophisticated health and wellness application designed to provide users with personalized, data-driven insights. It moves beyond generic advice by leveraging AI to generate tailored dietary and workout plans based on an individual's specific health metrics.

## What Problem This Project Solves

In a world saturated with generalized health advice, it's difficult for individuals to know what's right for their unique bodies. Vitality Compass addresses this by providing a platform where users can:

1.  **Track Key Metrics:** Log important health data such as weight, BMI, blood pressure, and cholesterol.
2.  **Receive Personalized Guidance:** Get AI-generated diet and workout plans that are directly tied to their own data, not just generic recommendations.
3.  **Visualize Progress:** Monitor their health journey over time with clear, intuitive charts and summaries.
4.  **Bridge the Gap:** Offer a practical tool that feels like having a personal health coach, making it easier to make informed decisions and build a healthier lifestyle.

## Core Features & What This Project Covers

*   **Secure User Authentication:** Full support for email/password sign-up and login, as well as an anonymous "guest" mode for users who want to try the app first.
*   **Health Data Management:** Users can add, view, and track their key health metrics over time. All data is securely stored in Firestore.
*   **AI-Powered Dietary Suggestions:** A Genkit flow that takes a user's latest health data and generates a highly specific, personalized diet plan. The AI is prompted to act like a meticulous dietician, justifying every recommendation based on the user's metrics.
*   **AI-Powered Workout Plans:** A separate Genkit flow creates a tailored 7-day workout schedule that considers the user's age, BMI, and health stats to recommend appropriate exercises.
*   **Progress Tracking & Visualization:** The dashboard features charts that visualize the user's progress for each metric over time, making it easy to see trends.
*   **AI Health Summary:** The application analyzes the change between a user's last two data entries and provides an AI-generated summary of their progress.
*   **Responsive Design:** A mobile-first interface featuring a bottom navigation bar for easy access on phones and a collapsible sidebar for desktop users.

## Technical Requirements & Stack

The application is built with a modern, production-ready tech stack:

*   **Framework:** Next.js (with App Router)
*   **Language:** TypeScript
*   **UI Library:** React
*   **Styling:** Tailwind CSS
*   **Component Library:** ShadCN UI
*   **AI Integration:** Genkit (from Google)
*   **AI Model:** Google Gemini 2.0 Flash
*   **Backend & Database:** Firebase (Authentication and Firestore for data storage)
*   **Forms:** React Hook Form with Zod for validation
*   **Charting:** Recharts
