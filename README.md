Fullstack Booking System – DevSecOps Project

Overview

This project is a secure, containerized fullstack booking system built with a strong focus on DevSecOps principles.

The application allows users to:

View available time slots
Create bookings
Reschedule bookings
Cancel bookings

The main goal of the project is not just functionality, but to demonstrate how a system can be transformed into a production-ready, secure, and automated solution.

Architecture

The system is built using a layered architecture with clear separation of concerns:

Frontend: Vanilla JavaScript (deployed on Vercel)
Backend: Node.js + Express (deployed on Railway)
Database: Supabase (PostgreSQL)
CI/CD: GitHub Actions
Containerization: Docker

Security Principle

The frontend is never trusted.
All validation, authentication, and authorization are handled in the backend and database.

Security Features
HTTP Security (Helmet)
Protects against:
Clickjacking
XSS
Unsafe resource loading
Adds secure HTTP headers automatically
CORS (Cross-Origin Resource Sharing)
Only allows requests from:
Local development
Production frontend (Vercel)
Prevents unauthorized external websites from accessing the API
Input Validation (Zod)
All incoming data is validated
Prevents:
Invalid input
Injection attacks
Application crashes
Authentication (JWT + Cookies)
Stateless user identification using JWT
Stored in httpOnly cookies
Protects against:
XSS attacks
Token manipulation

Note: This is a lightweight session system, not a full user authentication system.

Authorization
Each request is tied to a user ID
Users can only:
Modify their own bookings
Prevents IDOR (Insecure Direct Object Reference)
Rate Limiting
Limits API requests per user
Protects against:
Brute force attacks
API abuse
DoS attempts
Database Security (Supabase + RLS)
Backend uses service role key
Database logic handled via RPC functions
Row Level Security (RLS) enabled
Race Condition Protection
Booking logic handled in database
Atomic operations prevent:
Double bookings
Inconsistent data

Containerization (Docker)

The backend is fully containerized with focus on security:

Multi-stage build
Minimal base image
Non-root user
No secrets in image
.dockerignore implemented
CI/CD Pipeline (GitHub Actions)

The pipeline automatically runs on push:

Steps:
Install dependencies
Lint code (ESLint)
Run unit tests (Vitest)
Security scanning:
Semgrep (SAST)
Gitleaks (secrets scanning)
npm audit (dependencies)
Build Docker image
Scan container (Trivy)
Run API tests (Newman)
Run E2E tests (Playwright)
Deploy to production
Deployment
Frontend
Hosted on Vercel
Auto-deploy via Git
Backend
Hosted on Railway
Docker-based deployment
Security Configuration
HTTPS enabled
CORS configured
Environment variables used for secrets
Logging & Monitoring

The system uses structured logging for:

Booking actions
Errors
Security events
What is logged:
Event type
User ID
Order number (when relevant)
What is NOT logged:
Tokens
Secrets
Sensitive data
Incident Handling
Example Scenario:

Unauthorized booking manipulation attempt

Detection:
Logs show repeated failed requests
Response:
Analyze logs
Block suspicious behavior
Patch vulnerability
Post-mortem:
Identify root cause
Improve validation or authorization
Testing

The project includes multiple testing layers:

Unit tests (Vitest)
API tests (Postman + Newman)
End-to-End tests (Playwright)
Key Learnings
Security must be integrated from the start
Backend should never trust frontend input
CI/CD pipelines are critical for reliability
Real issues appear during deployment, not development
Defense-in-depth is essential
Conclusion

📦 Run Locally
# Install dependencies
npm install

# Start server
npm start
🐳 Run with Docker
docker build -t booking-app .
docker run -p 3000:3000 booking-app