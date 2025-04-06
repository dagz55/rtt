# VIP Transaction Tracker

This project provides a real-time tracker for multi-step VIP currency exchange transactions. It uses Next.js (with React, TypeScript, Shadcn UI, Tailwind CSS) for the frontend and Node.js (with Express, TypeScript, Mongoose, and Socket.IO) for the backend. MongoDB is used for data storage, managed via Docker Compose.

## Prerequisites

*   Node.js (v18 or later recommended)
*   npm (usually comes with Node.js)
*   Python (v3.6 or later recommended for the management script)
*   Docker and Docker Compose

## Setup & Running with `manage.py`

This project uses a Python management script (`manage.py`) to simplify setup, service management, and other common tasks.

1.  **Clone the Repository (if you haven't already):**
    ```bash
    git clone <your-repository-url>
    cd vip-transaction-tracker
    ```

2.  **Run Initial Setup:**
    *   Make sure Docker Desktop is running.
    *   Execute the setup command from the project root:
        ```bash
        python manage.py setup
        ```
    *   This command will:
        *   Check for prerequisites (Node, Python, Docker).
        *   Install required Python dependencies (like `rich`, `psutil`).
        *   Install Node.js dependencies for both the root (frontend) and `server/` (backend) directories using `npm install`.
        *   Create/update necessary environment files (`.env` in `server/` and `.env.local` in the root) and prompt you for required values like `JWT_SECRET`. Default values for `MONGO_URI` and `NEXT_PUBLIC_API_URL` will be used if the files don't exist.
        *   Compile the server's TypeScript code (`npm run build` in `server/`).

3.  **Start the Application:**
    *   To start all services (MongoDB, Backend Server, Frontend Client) using the interactive menu:
        ```bash
        python manage.py
        ```
        (Navigate the menu to start services)
    *   Alternatively, start all services directly via the command line:
        ```bash
        python manage.py start all
        ```
        (Or specify `mongodb`, `server`, or `client` individually)
    *   This will:
        *   Start the MongoDB container using `docker-compose up -d`.
        *   Start the backend server (default: `http://localhost:5000`).
        *   Start the frontend Next.js development server (default: `http://localhost:3000`).
    *   Open `http://localhost:3000` in your browser to view the application.

4.  **Stopping the Application:**
    *   To stop all running services managed by the script:
        ```bash
        python manage.py stop all
        ```
        (Or specify `mongodb`, `server`, or `client` individually)
    *   This will stop the client, server, and the MongoDB Docker container (`docker-compose down`).

## Other Management Commands (`manage.py`)

The `manage.py` script offers several other useful commands:

*   `python manage.py status`: Check the running status of services.
*   `python manage.py restart [all|mongodb|server|client]`: Restart services.
*   `python manage.py logs [server|mongodb]`: View logs for the backend or MongoDB. (Client logs appear in the terminal where `manage.py start client` or `manage.py start all` was run).
*   `python manage.py backup`: Create a backup of the MongoDB database.
*   `python manage.py restore <backup_file.zip>`: Restore the database from a backup.
*   `python manage.py health`: Run a health check on the services.
*   `python manage.py --help`: See all available commands and options.

## Project Structure

*   `app/`: Contains the Next.js frontend application routes and pages (Client Root).
*   `components/`: Contains shared React components.
*   `lib/`: Contains utility functions, types, and server actions.
*   `hooks/`: Contains custom React hooks (like `use-socket`).
*   `server/`: Contains the Node.js backend application (Express + TypeScript + Mongoose + Socket.IO).
*   `manage.py`: The Python management script.
*   `docker-compose.yml`: Defines the MongoDB service for local development.
*   `README.md`: This file.
