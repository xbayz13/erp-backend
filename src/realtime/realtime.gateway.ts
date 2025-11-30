import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ReportsService } from '../reports/services/reports.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly reportsService: ReportsService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  async broadcastSnapshot() {
    try {
      const snapshot = await this.reportsService.getOperationalSnapshot();
      this.server.emit('snapshot-update', snapshot);
    } catch (error) {
      console.error('Error broadcasting snapshot:', error);
    }
  }

  emitInventoryUpdate(data: any) {
    this.server.emit('inventory-update', data);
    this.broadcastSnapshot();
  }

  emitPurchaseOrderUpdate(data: any) {
    this.server.emit('purchase-order-update', data);
    this.broadcastSnapshot();
  }

  emitFinanceUpdate(data: any) {
    this.server.emit('finance-update', data);
    this.broadcastSnapshot();
  }

  emitProductionUpdate(data: any) {
    this.server.emit('production-update', data);
    this.broadcastSnapshot();
  }
}

