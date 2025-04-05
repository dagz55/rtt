import { io, Socket } from 'socket.io-client';
import { TransactionStep } from '../types/transaction';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ServerToClientEvents {
  transactionUpdate: (data: {
    transactionId: string;
    step: TransactionStep;
    additionalData?: any;
  }) => void;
}

interface ClientToServerEvents {
  joinTransaction: (transactionId: string) => void;
  leaveTransaction: (transactionId: string) => void;
}

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      this.socket.on('transactionUpdate', (data) => {
        this.notifyListeners('transactionUpdate', data);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinTransaction(transactionId: string) {
    if (this.socket) {
      this.socket.emit('joinTransaction', transactionId);
    }
  }

  leaveTransaction(transactionId: string) {
    if (this.socket) {
      this.socket.emit('leaveTransaction', transactionId);
    }
  }

  addListener(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  removeListener(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index !== -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private notifyListeners(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(data));
    }
  }
}

export const socketService = new SocketService();
export default socketService; 