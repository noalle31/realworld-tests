# RealWorld API Test Suite

[![API Tests](https://github.com/noalle31/realworld-tests/actions/workflows/api-tests.yml/badge.svg)](https://github.com/noalle31/realworld-tests/actions/workflows/api-tests.yml)

This is an automated API test suite built with **Playwright** and **TypeScript**, testing a self-hosted [RealWorld](https://github.com/gothinkster/realworld) ("Conduit") backend. The suite runs in CI on every push, standing up the backend in Docker and running the tests against it.

## Overview

This project tests the REST API of a Spring Boot RealWorld backend that is run locally via Docker Compose. The tests currently cover users, articles, and comments (happy paths/failure cases), and run automatically in GitHub Actions against a freshly started backend.

The focus is on testing the API: registering and authenticating users, creating and managing content, and verifying that the application works correctly with valid input and rejects invalid or unauthorized requests.

## Tech Stack

- **Playwright Test** - API testing via its `request` fixture
- **TypeScript** - test code and helpers
- **Docker Compose** - runs the backend (Spring Boot API + MySQL) locally and in CI
- **GitHub Actions** - continuous integration on every push and pull request

## What's Tested

The suite is organised by resources, with each covering both positive/failure cases.

### Users (`users.spec.ts`)
- Full registration → login → authenticated request flow, verifying a token is issued and grants access to a protected endpoint
- Login with a valid email but wrong password is rejected (401)

### Articles (`articles.spec.ts`)
- **CRUD:** create an article and read it back, update it and confirm the change persists, delete it and confirm it's gone
- **Authentication - Failure:** creating an article without a token is rejected (401)
- **Authorization - Failure:** a user cannot delete another user's article (403), and the article survives the attempt

### Comments (`comments.spec.ts`)
- **CRUD:** create a comment, list comments and confirm the created comment is present, delete a comment and confirm it's gone
- **Validation:** creating a comment with an empty body is rejected (400) with an expected message

## Running Locally

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) and [Node.js](https://nodejs.org/) 20 or higher.

1. Clone this repository and install dependencies:
   ```bash
   git clone https://github.com/noalle31/realworld-tests.git
   cd realworld-tests
   npm ci
   npx playwright install
   ```

2. Start the backend (Spring Boot API + MySQL) with Docker Compose:
   ```bash
   docker compose up -d
   ```
   Wait until the API is ready — you can check with `docker compose logs realworld-api` and look for the `Started RealworldApplication` line.

3. Run the tests:
   ```bash
   npx playwright test
   ```

4. View the HTML report:
   ```bash
   npx playwright show-report
   ```

To stop the backend when you're done:
```bash
docker compose down
```

> **Tip:** if you've run the suite many times locally, the database accumulates data. To reset to a clean state, run `docker compose down -v` (the `-v` removes the database volume), then `docker compose up -d` again.

## How CI Works

The GitHub Actions workflow (`.github/workflows/api-tests.yml`) runs the full suite against a freshly started backend on every push and pull request. Because a CI runner starts as a bare machine with no backend, the workflow has to stand the application up itself:

1. Check out the repository
2. Start the backend with `docker compose up -d`
3. **Wait until the API responds** - a retry loop polls the API until it returns a real HTTP response
4. Install Node, dependencies, and Playwright browsers
5. Run the test suite
6. Upload the Playwright HTML report as an artifact

## Notes on Design Decisions

- **The backend's spec read from source.** This implementation deviates from the RealWorld spec in a few ways, for example - endpoints are mounted at the root (e.g. `/users`, not `/api/users`), it uses a `Token` authorization scheme rather than `Bearer`, and some endpoints the spec leaves public are actually protected These were discovered by reading the application's controllers and security configuration, and the tests assert against the app's *actual* behaviour.

- **Assertions target behaviour, not specific details.** Where the exact status is known and expected (e.g. 401 vs 403 vs 400), it's asserted explicitly. Where an error message is generic, the test checks the status code rather than a string that might change.

- **Shared setup is extracted into helpers.** Registration/login and article/comment creation are factored into helpers (`registerAndLogin`, `createArticle`, `createComment`) so test bodies focus on the tested behaviour. The helpers take the logged-in user as a parameter instead of creating their own hidden users.

- **Known test-isolation trade-off.** Tests generate unique data per run and rely on CI's fresh database for isolation. Under a long-lived local database with parallel workers, accumulated data can occasionally cause collisions; resetting the local database (`docker compose down -v`) restores a clean slate. In a production suite this would be hardened with guaranteed-unique identifiers and/or per-run database seeding.


## Project Structure

```
.
├── tests/
│   ├── users.spec.ts        # user registration, login, auth
│   ├── articles.spec.ts     # article CRUD + auth/authorization
│   ├── comments.spec.ts     # comment CRUD + validation
│   └── helpers.ts           # shared setup helpers
├── docker-compose.yml       # backend (API + MySQL) for local + CI
├── playwright.config.ts     # Playwright configuration
└── .github/workflows/
    └── api-tests.yml        # CI workflow
```
