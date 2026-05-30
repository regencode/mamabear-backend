import { Injectable } from '@nestjs/common';
import * as MidtransClient from 'midtrans-client';

@Injectable()
export class MidtransService 
extends MidtransClient.Snap {
  constructor() {
    super({
        isProduction: false,
        serverKey: process.env.MIDTRANS_SERVER_KEY!, // Sandbox Server Key
        clientKey: process.env.MIDTRANS_CLIENT_KEY!,  // Sandbox Client Key
    });
  }
}
