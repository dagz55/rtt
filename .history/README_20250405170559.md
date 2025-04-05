# VIP Transaction Tracker

A real-time currency exchange transaction tracking system built with Node.js, Express, React, and MongoDB.

## Features

- Real-time transaction status updates using Socket.IO
- Multi-step transaction tracking with timestamps
- Digital document handling and signatures
- Automated notifications for transaction status changes
- 15% handling fee calculation
- Dollar serial number verification
- Administrative dashboard
- Secure API endpoints
- Interactive service management system

## Tech Stack

- **Frontend**: React with TypeScript, Material-UI, Socket.IO Client, Chart.js
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB
- **Real-time Updates**: Socket.IO
- **Authentication**: JWT (JSON Web Tokens)
- **Service Management**: Python with Rich TUI
- **API Documentation**: Swagger/OpenAPI (coming soon)

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v7.0 or higher)
- Python (v3.6 or higher)
- npm or yarn package manager
- Docker and Docker Compose (optional)
- Required Python packages (install via pip):
  ```bash
  pip install psutil rich requests
  ```

## Project Structure

```
vip-transaction-tracker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── utils/        # Utility functions
│   │   └── context/      # React context providers
│   └── package.json
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # MongoDB models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utility functions
│   └── package.json
├── manage.py             # Service management script
├── docker-compose.yml    # Docker services configuration
├── CHANGELOG.md         # Project change history
└── README.md
```

## Getting Started

### Using the Management Script (Recommended)

The project includes a Python management script that provides an interactive interface for managing all services:

1. Make sure you have the required Python packages:
   ```bash
   pip install psutil rich requests
   ```

2. Start the management interface:
   ```bash
   python3 manage.py
   ```

   Or use specific commands:
   ```bash
   python3 manage.py start all    # Start all services
   python3 manage.py stop all     # Stop all services
   python3 manage.py restart all  # Restart all services
   python3 manage.py status       # Check service status
   ```

The management script provides:
- Interactive menu for service control
- Real-time service status monitoring
- Automatic port conflict resolution
- Log viewing capabilities
- Graceful service shutdown

### Manual Setup

If you prefer to set up the project manually, follow these steps:

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd vip-transaction-tracker
   ```

2. Install dependencies:
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. Set up environment variables:
   ```bash
   # In the server directory
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start MongoDB:
   ```bash
   # Using Homebrew on macOS
   brew services start mongodb/brew/mongodb-community@7.0
   
   # Or using Docker
   docker-compose up -d mongodb
   ```

5. Start the development servers:
   ```bash
   # Start the backend server (from the server directory)
   npm run dev

   # Start the frontend development server (from the client directory)
   npm run dev
   ```

### Docker Setup (Optional)

1. Build and start all services:
   ```bash
   docker-compose up -d
   ```

2. Stop all services:
   ```bash
   docker-compose down
   ```

## API Endpoints

### Transactions

- `POST /api/transactions` - Create a new transaction
- `GET /api/transactions` - List all transactions (with pagination)
- `GET /api/transactions/:id` - Get transaction details
- `PUT /api/transactions/:id/step` - Update transaction step

## Transaction Steps

1. INITIATED - Transaction created
2. PESO_DROPPED - Peso amount dropped at main office
3. PESO_VALIDATED - Peso validated and documents signed
4. DOCUMENTS_SIGNED - All required documents signed
5. DOLLAR_DELIVERY_SCHEDULED - Dollar delivery appointment set
6. DOLLAR_SERIAL_VERIFIED - Dollar bills verified
7. RECEIPT_SIGNED - Final receipt signed
8. COMPLETED - Transaction completed

## Real-time Updates

The application uses Socket.IO for real-time updates. Clients can subscribe to transaction updates by joining the transaction room:

```javascript
socket.emit('joinTransaction', transactionId);
```

## Troubleshooting

### Port Conflicts
If you encounter port conflicts, the management script will automatically detect them and provide options to:
- Stop the conflicting process
- Use a different port
- Cancel the operation

### Service Issues
1. Check service status:
   ```bash
   python3 manage.py status
   ```
2. View service logs:
   ```bash
   python3 manage.py
   # Then select option 7 to view logs
   ```
3. Restart services:
   ```bash
   python3 manage.py restart all
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed list of changes.

## License

This project is licensed under the ISC License.

## Support

For support, please open an issue in the repository or contact the development team. 