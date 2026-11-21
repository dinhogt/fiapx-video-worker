import { MetricsController } from './metrics.controller';

describe('MetricsController', () => {
  it('exposes prometheus metrics', async () => {
    const controller = new MetricsController();
    const body = await controller.metrics();
    expect(body).toContain('process_cpu');
  });
});
