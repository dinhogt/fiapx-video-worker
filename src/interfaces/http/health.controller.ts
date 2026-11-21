import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService } from '../../infrastructure/health/health.service';

@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get('health/live')
  live(): { status: 'ok' } {
    return this.health.live();
  }

  @Get('health/ready')
  async ready(@Res({ passthrough: true }) res: Response) {
    const result = await this.health.ready();
    if (!result.ready) {
      res.status(503);
    }
    return result;
  }
}
