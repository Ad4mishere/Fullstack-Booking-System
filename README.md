# Fullstack Booking System – DevSecOps Project

## Overview

This project is a secure, containerized fullstack booking system developed with a focus on DevSecOps principles. The application allows users to view available time slots, create bookings, reschedule them, and cancel existing bookings.

The primary goal of the project is not only to deliver functionality, but to transform a basic application into a production-ready system by integrating security, automation, and cloud deployment.

## Architecture

The system is built using a layered architecture with clear separation of concerns:

- Frontend: Vanilla JavaScript (deployed on Vercel)
- Backend: Node.js with Express (deployed on Railway)
- Database: Supabase (PostgreSQL)
- CI/CD: GitHub Actions
- Containerization: Docker

The frontend communicates with the backend through HTTP requests. All business logic, validation, authentication, and security controls are handled in the backend. The database is used not only for storage but also for enforcing consistency and transactional logic.

A key architectural principle in this project is that the frontend is never trusted. All validation and security checks are performed on the server side.

## Security Features

### HTTP Security Headers

The application uses middleware to set secure HTTP headers. This protects against common web-based attacks such as cross-site scripting (XSS), clickjacking, and unsafe resource loading. These headers instruct the browser to enforce stricter security rules when rendering the application.

### CORS (Cross-Origin Resource Sharing)

Since the frontend and backend are deployed on different domains, CORS is explicitly configured. Only trusted origins (local development and the production frontend) are allowed to communicate with the backend.

This prevents unauthorized websites from making requests to the API and abusing user sessions.

### Input Validation

All incoming data is validated in the backend before being processed. Validation ensures that data types, formats, and required fields are correct.

This protects against:

- Invalid or malformed input
- Injection attacks
- Logical inconsistencies

The system follows the principle that all client input must be treated as untrusted.

### Authentication

The system uses a lightweight authentication model based on JSON Web Tokens (JWT). Each user is assigned a unique identifier that is signed and stored in a cookie.

Cookies are configured with:

- httpOnly
- secure (in production)
- sameSite

This prevents client-side scripts from accessing authentication data and reduces the risk of token theft.

This implementation acts as a stateless session system rather than a full user account system.

### Authorization

Each request is associated with a user identity. The backend verifies that users can only access or modify resources that belong to them.

This prevents unauthorized access to bookings and protects against IDOR (Insecure Direct Object Reference) attacks.

### Rate Limiting

Rate limiting is applied to API routes to restrict the number of requests a client can make within a given time window.

This protects against:

- Brute force attacks
- API abuse
- Denial-of-service attempts

### Database Security

The system uses Supabase as a database layer. Sensitive operations are handled through database functions to ensure atomic execution.

Row Level Security (RLS) is enabled to provide an additional security layer and enforce access control at the database level.

### Race Condition Protection

Booking logic is implemented in a way that prevents multiple users from booking the same time slot simultaneously.

This is achieved through atomic database operations, ensuring consistency even under concurrent requests.

## Containerization

The backend is containerized using Docker to ensure consistent environments across development and production.

Key aspects of the container setup include:

- Multi-stage builds
- Minimal base image
- Non-root user execution
- No credentials stored in the image
- Use of environment variables for configuration

This reduces the attack surface and ensures secure handling of sensitive data.

## CI/CD Pipeline

A CI/CD pipeline is implemented using GitHub Actions to automate testing, security scanning, and deployment.

The pipeline includes the following steps:

- Install dependencies
- Run linting (ESLint)
- Execute unit tests
- Perform security scanning:
  - Static analysis (Semgrep)
  - Secret scanning (Gitleaks)
  - Dependency scanning (npm audit)
- Build Docker image
- Scan container image (Trivy)
- Run API tests (Newman)
- Run end-to-end tests (Playwright)
- Deploy application

Security is integrated throughout the pipeline, ensuring that vulnerabilities can be detected early in the development process.

## Deployment

The application is deployed in a cloud environment with automated deployment from the Git repository.

### Frontend

- Hosted on Vercel
- Automatically deployed on push

### Backend

- Hosted on Railway
- Deployed as a containerized service

Security considerations include:

- HTTPS enabled
- Environment variables for secrets
- Proper CORS configuration

## Logging and Monitoring

The application implements structured logging to track system behavior and detect anomalies.

The system logs:

- Booking actions
- Errors
- Security-related events

Sensitive data such as tokens and secrets are not logged.

These logs can be used to identify suspicious activity and support incident analysis.

## Incident Handling

A potential incident scenario involves unauthorized attempts to manipulate bookings.

### Detection

Repeated failed requests or unusual patterns in logs

### Response

- Analyze logs
- Identify the source
- Mitigate the issue (e.g., blocking or patching)

### Post-incident

- Review root cause
- Improve validation or authorization
- Update monitoring if necessary

## Testing

The system includes multiple layers of testing:

- Unit tests for core logic
- API tests for endpoint validation
- End-to-end tests for full user flows

This ensures both functional correctness and system stability.

## Run Locally

Install dependencies and start the application:

npm install  
npm start

## Run with Docker

Build and run the container:

docker build -t booking-app .  
docker run -p 3000:3000 booking-app

## Conclusion

This project demonstrates how a simple application can be transformed into a secure, automated, and production-ready system.

It integrates security, containerization, CI/CD, and cloud deployment into a cohesive workflow aligned with DevSecOps practices