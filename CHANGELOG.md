# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Python Management Script (`manage.py`)**: Centralized script for project lifecycle management.
  - **Interactive TUI Mode**: Default mode (`python manage.py`) for easy service control (start/stop/restart/status).
  - **Command-Line Interface**: Added specific commands (e.g., `python manage.py start all`, `python manage.py setup`, `python manage.py logs server`). Use `python manage.py --help` for details.
  - **Automated Setup (`setup`)**: Installs Python & Node dependencies, checks prerequisites, configures environment files (`.env`, `.env.local`), builds server code.
  - **Service Management (`start`, `stop`, `restart`, `status`)**: Controls MongoDB (via Docker), Backend Node.js server, and Frontend Next.js client.
  - **Log Viewing (`logs`)**: Access backend and MongoDB logs. (Client logs are viewed in the execution terminal).
  - **Database Management (`backup`, `restore`)**: Backup and restore MongoDB data.
  - **Health Checks (`health`)**: Comprehensive system health verification.
  - **Monitoring (`monitor`)**: Basic service monitoring capabilities.
  - **Update (`update`)**: Pulls latest changes from git and runs setup.
  - **Docker Deployment (`docker`)**: Basic support for Docker Compose deployment.
  - **Port Conflict Handling**: Detects and offers to resolve port conflicts.
- Real-time transaction updates using Socket.IO (Integrated with backend server).
- MongoDB integration with Mongoose ODM in the backend server.
- Environment configuration management (`.env` for server, `.env.local` for client).
- Basic error handling and logging (`vip_manager.log`, `server/logs/server.log`).

### Changed
- **Development Workflow**: Streamlined setup and running process using `manage.py`. Replaced separate `npm install` and `npm run dev/start` steps with `python manage.py setup` and `python manage.py start all`.
- **Project Structure**: Client code is now the root Next.js application (`.`). Backend remains in `server/`.
- **Client Startup**: Uses `npm run dev` (managed by `manage.py`). Removed Vite-specific logic.
- **Dependencies**: Updated based on Next.js and Express setup. `manage.py` handles Python dependencies.
- **README**: Updated to reflect the new `manage.py` workflow.

### Fixed
- **Port Conflict Handling**: Improved detection in `manage.py`.
- **Dependency Installation**: `manage.py setup` now correctly installs dependencies in both root and `server/` directories.
- **Log Management**: Corrected log file paths and viewing logic in `manage.py`.
- Removed outdated references to Material-UI and Chart.js (using Shadcn UI now).
- Corrected `psutil` usage in `manage.py` for compatibility.

## [0.1.0] - 2024-04-05

### Added
- Initial project setup
- Basic MERN stack implementation
- Docker configuration for development
- Basic transaction management functionality
- User authentication system
- Project documentation
