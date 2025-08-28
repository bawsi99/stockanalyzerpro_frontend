# Welcome to your Lovable project

## Configuration

This frontend application uses environment variables for configuration. See [CONFIGURATION.md](./CONFIGURATION.md) for detailed setup instructions.

### Quick Setup

1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Choose your backend mode and modify `.env.local` accordingly:

#### Option 1: Single Service Mode (Recommended for simple development)
When running only the data service: `python data_service.py`
```env
VITE_BASE_SERVICE_URL=http://localhost:8000
VITE_WEBSOCKET_URL=ws://localhost:8000/ws/stream
```

#### Option 2: Multi Service Mode
When running both services: `python run_services.py`
```env
VITE_BASE_SERVICE_URL=http://localhost:8000
VITE_WEBSOCKET_URL=ws://localhost:8000/ws/stream
```

#### Option 3: Production Mode
When deployed on Render:
```env
VITE_BASE_SERVICE_URL=https://stockanalyzer-pro.onrender.com
VITE_WEBSOCKET_URL=wss://stockanalyzer-pro.onrender.com/data/ws/stream
```

### Backend Modes Explained

- **Single Service Mode**: Data service only on port 8000. All endpoints are direct (e.g., `/stock/{symbol}/history`). Use this for simple development and testing.

- **Multi Service Mode**: Data service on port 8000, analysis service on port 8001. Data endpoints are direct, analysis endpoints use port 8001. Use this for full functionality testing.

- **Production Mode**: Consolidated service with all endpoints mounted under `/data` and `/analysis`. Use this for production deployment.

The frontend automatically detects the environment and adjusts endpoint URLs accordingly.

## Chart Components Overview

- **LiveSimpleChart**: Main chart component for real-time, live-updating stock data. Handles all WebSocket connections and live data streaming. Use this for any live charting needs. Do not modify its WebSocket logic unless you are updating the live data infrastructure.
- **EnhancedSimpleChart**: Used for static or enhanced chart rendering with technical indicators and pattern overlays. Does not handle live data or WebSocket connections. Use this for historical or non-live chart displays.
- **ChartTest**: For testing the chart library integration. Not used in production.
- **SimpleChart**: (Deprecated) This component has been removed as it was not used anywhere in the codebase and was superseded by the above components.

## Project info

**URL**: https://lovable.dev/projects/2f2c3e6d-81ed-4f81-8e96-4b887e117f0d

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/2f2c3e6d-81ed-4f81-8e96-4b887e117f0d) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/2f2c3e6d-81ed-4f81-8e96-4b887e117f0d) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
