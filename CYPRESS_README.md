# 🧪 Cypress E2E Tests - Covoit Application

## 🎯 What These Tests Do

The test suite covers the following user workflows:

1. **Authentication** (`01-login.cy.js`)
   - Login with test user credentials
   - Verify successful redirect to dashboard

2. **Personal Vehicle Management** (`02-vehiculePerso.cy.js`)
   - Create a personal vehicle
   - Fill in all vehicle details (brand, model, registration, etc.)
   - Verify vehicle appears in the list

3. **Invalid Annonce Creation** (`03-creeAnnonceMauvaise.cy.js`)
   - Test form validation errors
   - Verify error messages for:
     - Date in the past
     - Invalid duration (0 minutes)
     - Invalid distance (negative value)

4. **Valid Annonce Creation** (`04-creeAnnonce.cy.js`)
   - Create a complete covoiturage announcement
   - Fill departure and arrival addresses
   - Select a vehicle
   - Verify annonce is created successfully

5. **Annonce Deletion** (`05-supprimerAnnonce.cy.js`)
   - Delete all created annonces
   - Verify "no annonces" message appears

6. **Vehicle Deletion** (`06-supprimerVoiturePerso.cy.js`)
   - Delete personal vehicle
   - Verify vehicle is removed

7. **Final Cleanup Verification** (`99-verificationNettoyage.cy.js`)
   - Verify no annonces remain
   - Verify no personal vehicle remains
   - Confirm clean state

## 🚀 How Tests Are Triggered

### Automatic (GitHub Actions)

Tests run automatically in two scenarios:

1. **On Main Branch** - After successful deployment
   - Workflow: `cypress-e2e.yml`
   - Triggers after "Deploy Angular to Production" completes
   - Waits 20 seconds for deployment to stabilize
   - Sends Discord notifications with results

2. **On Feature Branches** - On every push
   - Workflow: `cypress-e2e-test.yml`
   - Runs on any branch except `main`
   - Can also be triggered manually via GitHub Actions UI
   - No Discord notifications (testing only)

### Manual (Local Development)

You can run tests locally on your machine for development and debugging.

## 🛠️ Local Setup


### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```
   This will install Cypress and all required dependencies from `package.json`.

2. **Create environment file:**
   
   Create a file named `cypress.env.json` in the root directory:
   ```json
   {
     "TEST_USER_EMAIL": "your-test-user@example.com",
     "TEST_USER_PASSWORD": "your-test-password"
   }
   ```
   
   ⚠️ **Important:** This file is ignored by git (`.gitignore`) to prevent committing sensitive credentials.


## 🎮 Running Tests Locally

### Interactive Mode (Recommended for Development)

Open the Cypress Test Runner with a visual interface:

```bash
npx cypress open
```

This will:
- Open the Cypress GUI
- Show all available test files
- Allow you to select and run individual tests
- Display real-time browser interactions
- Enable debugging with DevTools
- Show step-by-step test execution

**Benefits:**
- See exactly what Cypress is doing
- Pause and inspect the application state
- Debug failing tests interactively
- Time-travel through test steps

### Headless Mode (CI/CD Simulation)

Run all tests in headless mode (no GUI), just like GitHub Actions:

```bash
npx cypress run
```

**Run with specific browser:**
```bash
npx cypress run --browser chrome
```

## 📸 Screenshots and Artifacts

### Local Testing
- **Screenshots:** Saved to `cypress/screenshots/` when tests fail
- **Videos:** Disabled by default (set `video: true` in config to enable)

### GitHub Actions
- **Screenshots:** Uploaded as artifacts (available for 30 days)
- **Access:** Go to failed workflow run → "Artifacts" section → Download "cypress-screenshots"

