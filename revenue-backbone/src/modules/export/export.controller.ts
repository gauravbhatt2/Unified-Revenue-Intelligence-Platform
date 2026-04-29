import { Controller, Get, Param, Query, Res, Req } from '@nestjs/common';
import { Request, Response } from 'express';
import { ExportService } from './export.service';
import { getRequestAuth } from '../../common/auth/request-auth.util';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('account/:id')
  async exportByAccount(
    @Param('id') id: string,
    @Query('format') format: 'json' | 'csv' = 'json',
    @Req() req: Request & { headers: Record<string, string | string[] | undefined> },
    @Res() res: Response,
  ) {
    const { tenantId, userId } = getRequestAuth(req);
    const requestedBy = userId;
    const result = await this.exportService.exportByAccount(tenantId, id, format, requestedBy);

    if (format === 'csv') {
      const csvResult = result as {
        content: string;
        totalInteractions: number;
        excludedCount: number;
        redactedCount: number;
      };
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="account-${id}-interactions.csv"`);
      res.setHeader('X-Total-Interactions', String(csvResult.totalInteractions));
      res.setHeader('X-Excluded-Count', String(csvResult.excludedCount));
      res.setHeader('X-Redacted-Count', String(csvResult.redactedCount));
      return res.send(csvResult.content);
    }

    return res.json(result);
  }

  @Get('deal/:id')
  async exportByDeal(
    @Param('id') id: string,
    @Query('format') format: 'json' | 'csv' = 'json',
    @Req() req: Request & { headers: Record<string, string | string[] | undefined> },
    @Res() res: Response,
  ) {
    const { tenantId, userId } = getRequestAuth(req);
    const requestedBy = userId;
    const result = await this.exportService.exportByDeal(tenantId, id, format, requestedBy);

    if (format === 'csv') {
      const csvResult = result as {
        content: string;
        totalInteractions: number;
        excludedCount: number;
        redactedCount: number;
      };
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="deal-${id}-interactions.csv"`);
      res.setHeader('X-Total-Interactions', String(csvResult.totalInteractions));
      res.setHeader('X-Excluded-Count', String(csvResult.excludedCount));
      res.setHeader('X-Redacted-Count', String(csvResult.redactedCount));
      return res.send(csvResult.content);
    }

    return res.json(result);
  }

  @Get('logs')
  getLogs(@Req() req: Request) {
    const { tenantId } = getRequestAuth(req);
    return this.exportService.getExportLogs(tenantId);
  }
}
