# Deployment & Local Setup

This guide explains how to run Skill Versus locally and how to access the full application functionality.

## GitHub Repository
[https://github.com/altf4-games/Skill-Versus](https://github.com/altf4-games/Skill-Versus)

## Running Locally

To run the frontend application on your local machine:

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open the URL shown in your terminal (usually `http://localhost:5173`).

## Removing the "End of Service" Screen

By default, the application now shows an "End of Service" message. To remove this screen and access the full application:

1.  Open `frontend/src/App.jsx`.
2.  Locate the `SHOW_END_OF_SERVICE` constant at the top of the file (around line 32).
3.  Change its value from `true` to `false`:

    ```javascript
    // Before
    const SHOW_END_OF_SERVICE = true;

    // After
    const SHOW_END_OF_SERVICE = false;
    ```
4.  Save the file. The application will automatically reload and show the main interface.
