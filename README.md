# SmartTarget - Full-Stack SMART Goals MCQ Assessment & Admin Portal

A full-stack, enterprise-grade SMART Goals (Specific, Measurable, Achievable, Relevant, Time-bound) certification assessment platform built with React, Vite, Tailwind CSS, Express, Prisma, SQLite, and Recharts.

---

## 🎯 Architecture & Security Highlights

- **Server-Side Scoring Only**: Answers and percentages are strictly evaluated on the server. The client never calculates the score.
- **Data Protection Guarantee**: Test questions and options served to candidates **NEVER** contain `isCorrect` flags or explanations prior to final submission.
- **Anti-Cheating & Resubmission Prevention**: One attempt per test start. Once submitted, the attempt is sealed—re-submissions are rejected with HTTP 400.
- **Role-Based Access Control**: Sensitive routes (`/api/admin/*`) and UI tabs are protected by JWT authentication and strict `requireAdmin` middleware.
- **JWT in httpOnly Cookies**: Tokens are safely stored in `httpOnly`, `sameSite: lax` cookies with fallback Bearer header support.

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Recharts, Lucide Icons, React Router v7
- **Backend**: Node.js, Express 5, Prisma ORM 6, SQLite (`dev.db`), bcryptjs, jsonwebtoken, cookie-parser
- **Testing**: Automated end-to-end flow test suite (`server/test-flow.js`)

---

## 👥 Simplified User & Admin Workflow

1. **Candidate / Student Flow**:
   - No forced account registration required!
   - Students simply enter their **Full Name** and **USN (University Seat Number)** on the homepage and click **Start Assessment**.
   - Timed test with one question at a time navigation, real-time progress, and auto-submit on timeout.
   - Immediate results screen showing **Student Name**, **USN**, **Final Score**, **Accuracy %**, **SMART Category Breakdown**, and detailed Question Reviews with explanations.

2. **Admin Portal Flow**:
   - Access via the **Admin Portal** button in the navbar.
   - Login using `admin@example.com` / `Admin@123` (or the 1-click **Admin** demo autofill button).
   - Real-time Submissions table showing:
     - **USN**
     - **Student Name**
     - **Score & Total Questions**
     - **Accuracy Rate (%)**
     - **Pass/Fail Status**
     - **Duration & Submission Date**
   - Search & filter by **USN** or **Student Name**.
   - Detailed audit modal for any student's attempt.
   - One-click **Export CSV** containing student **USN** and **Name**.
   - Recharts visual analytics dashboard.

---

## 🚀 Setup & Running Locally

### Prerequisites
- Node.js (v18+ or v20+)
- npm

### 1. Backend Setup
```bash
cd server
npm install
npm run db:push
npm run db:seed
npm run dev
```
Backend runs on `http://localhost:5000`.

### 2. Frontend Setup
In a separate terminal:
```bash
cd client
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`. Vite proxies `/api` requests directly to `http://localhost:5000`.

---

## 🧪 Running Automated Tests

To run the automated 12-step end-to-end integration test suite:
```bash
cd server
node test-flow.js
```

### Verified Test Cases:
1. Health check (`/api/health`)
2. Admin authentication & JWT token generation
3. Candidate authentication
4. Role middleware security (Candidate accessing `/api/admin/*` returns 403 Forbidden)
5. Admin route access (`/api/admin/tests`)
6. Public test discovery
7. Security verification: Questions served to candidate have **NO** `isCorrect` and **NO** explanations
8. Server-side answer scoring & SMART dimension breakdown calculation
9. Anti-resubmission validation (Attempt cannot be submitted twice)
10. Admin candidate submissions retrieval
11. Admin Recharts analytics metrics computation
12. CSV spreadsheet generation & header verification

---

## 🌟 Key Features

### Candidate Portal (User)
- **Framework Introduction**: Visual breakdown of the 5 SMART pillars.
- **Timed Assessment Interface**:
  - One question at a time navigation with "Previous" and "Next".
  - Real-time countdown timer with visual urgency alerts when under 2 minutes.
  - Automatic submission when time expires.
  - Question jump palette indicating answered vs. unanswered questions.
  - SMART category badges (S/M/A/R/T) for each question.
- **Detailed Result & Feedback**:
  - Overall score, percentage, and PASSED / NEEDS IMPROVEMENT status.
  - Time spent breakdown.
  - SMART dimension competency matrix (individual accuracy bars for S, M, A, R, T).
  - Item-by-item answer review showing candidate's choice, correct choice, and in-depth SMART explanations.
- **Candidate History**: Review past test records, dates, and scores.

### Administrative Control Center (Admin)
- **Analytics & Insights Dashboard**:
  - KPI summary (total attempts, average accuracy, pass rate, registered candidates).
  - Recharts bar chart of accuracy across SMART dimensions (S, M, A, R, T).
  - Recharts score distribution histogram (0-40%, 41-60%, 61-79%, 80-100%).
  - Hardest questions analysis (top 5 lowest accuracy items).
- **Submissions Audit Table**:
  - Live candidate attempts table with search by name/email/test.
  - Filter by status (Passed, Failed, In Progress) and sort options.
  - Detail inspection modal auditing candidate's exact answer vs. correct answer with explanation.
  - Delete individual attempt records.
- **CSV Data Export**: One-click download of all submissions in CSV format.
- **Assessment Management (CRUD)**: Create, edit, toggle publish status, or delete test configurations.
- **Question Bank Management (CRUD)**:
  - Add and edit 4-option multiple choice questions.
  - Assign SMART categories (S, M, A, R, T) and explanations.
  - Mark single correct option with interactive radio buttons.
