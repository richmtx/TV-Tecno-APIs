import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Servicio de API REST del canal de televisión del Instituto Tecnológico de Durango (TV TECNO XHITD 16.1)';
  }
}