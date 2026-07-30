# AI Prompts Log & Development Notes

This document records the AI tooling prompt history available for AutoHaus, together with the resulting development notes. OpenAI Codex, Gemini / Google Antigravity, and Claude were used as pair-programming tools for scaffolding, test boilerplate, debugging, and UI refinement; the application scope, workflows, and verification criteria were driven by the project requirements.

## AI tools used

- **OpenAI Codex:** implementation support, test execution, debugging, repository maintenance, and documentation.
- **Gemini / Google Antigravity:** architecture planning, development environment support, and workflow iteration.
- **Claude:** backend and frontend scaffolding, test boilerplate, UI component drafts, and documentation support.

The phase prompts below are the project prompt record retained in this repository. They are written with the outcome notes needed to explain the development process during an interview.

## Development workflow

The work followed a practical Red-Green-Refactor cycle:

1. Define the expected behaviour and edge cases.
2. Draft or update tests for the behaviour.
3. Implement the smallest maintainable change.
4. Run the relevant test suite and frontend build.
5. Refine the implementation only after the feature worked end to end.

## Phase 1 - Architecture and TDD setup

**Prompt**

> I want to build a Car Dealership Inventory System following TDD principles. Set up an Express backend with MongoDB and a Vite React frontend with Tailwind CSS. First create failing test specifications for user authentication and vehicle endpoints.

**Development notes**

- Set up the Express application separately from the server startup code so that routes could be tested with Supertest.
- Added Jest configuration and an `mongodb-memory-server` test harness.
- Drafted unit and integration tests for authentication, vehicle access, stock handling, and role-based permissions.

## Phase 2 - Core endpoints and stock safety

**Prompt**

> Implement the User and Vehicle schemas, JWT authentication middleware, and purchase service. Purchase requests must safely reduce inventory and never allow a vehicle quantity to become negative.

**Development notes**

- Added Mongoose models, JWT middleware, centralized error handling, and protected Express routes.
- Implemented server-side stock validation and atomic inventory reduction.
- Added tests for insufficient stock, missing vehicles, customer/admin permissions, and restocking.

## Phase 3 - React frontend and administration

**Prompt**

> Build the frontend with React Router and Tailwind CSS. Include a searchable vehicle catalogue, purchase confirmation, customer purchase history, and a protected admin dashboard for inventory management and analytics.

**Development notes**

- Built reusable components such as `VehicleCard`, `SearchFilterBar`, `VehicleFormModal`, and confirmation dialogs.
- Added `AuthContext`, protected routes, toast notifications, purchase history, and admin-only inventory controls.
- Preserved the AutoHaus visual system while making the interface responsive and task-focused.

## Phase 4 - Indian inventory and invoice management

**Prompt**

> Extend the existing MERN project without rebuilding it. Add a realistic Indian vehicle catalogue, INR pricing, unique local vehicle images, invoice generation, PDF downloads, customer invoice history, and admin invoice management.

**Development notes**

- Added the Indian-market inventory catalogue and local vehicle image assets.
- Added invoice number sequencing, invoice records, protected invoice APIs, and PDF generation with PDFKit.
- Extended the admin dashboard with invoice sales metrics, top vehicles, top customers, and recent invoice activity.
- Verified the invoice PDF visually and added tests for invoice creation, numbering, ownership checks, downloads, archiving, and checkout behaviour.

## Verification summary

The current backend suite contains four test suites and 35 passing tests. It covers authentication, vehicle operations, checkout, invoice creation and downloads, out-of-stock handling, and authorization. The frontend production build is also run after UI changes.

## Reflection

Using AI as a pair-programming assistant reduced time spent on repetitive setup and allowed faster iteration on tests and UI details. The important engineering work remained in turning requirements into clear behaviours, checking the generated code against real test output, and refining the implementation until the customer and admin flows worked together.
