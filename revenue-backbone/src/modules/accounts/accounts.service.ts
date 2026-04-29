import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RevenueGraphService } from '../revenue-graph/revenue-graph.service';

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revenueGraph: RevenueGraphService,
  ) {}

  async findAll(tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.account.findMany({
        where: { tenantId },
        include: {
          _count: {
            select: { contacts: true, interactions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async findById(tenantId: string, accountId: string) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }

    const account = await this.prisma.withTenant(tenantId, (tx) =>
      tx.account.findFirst({
        where: { id: accountId, tenantId },
        include: {
          contacts: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isOptedOut: true,
              optedOutAt: true,
              optOutReason: true,
            },
          },
          deals: { select: { id: true, name: true, stage: true, amount: true } },
        },
      }),
    );

    if (!account) throw new NotFoundException(`Account ${accountId} not found for tenant ${tenantId}`);
    return account;
  }

  async getInteractions(tenantId: string, accountId: string) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }

    const account = await this.prisma.withTenant(tenantId, (tx) =>
      tx.account.findFirst({ where: { id: accountId, tenantId } }),
    );
    if (!account) throw new NotFoundException(`Account ${accountId} not found for tenant ${tenantId}`);

    return this.revenueGraph.getInteractionsByAccount(tenantId, accountId);
  }
}
