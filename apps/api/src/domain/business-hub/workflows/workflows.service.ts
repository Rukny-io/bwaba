import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import {
  CreateBusinessWorkflowDto,
  UpdateBusinessWorkflowDto,
} from './dto/workflow.dto';

const DEFAULT_DEFINITION = {
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
};

@Injectable()
export class BusinessWorkflowsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    return this.prisma.businessWorkflow.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getForUser(userId: string, id: string) {
    const workflow = await this.prisma.businessWorkflow.findFirst({
      where: { id, userId },
    });
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }
    return workflow;
  }

  async createForUser(userId: string, dto: CreateBusinessWorkflowDto) {
    return this.prisma.businessWorkflow.create({
      data: {
        userId,
        name: dto.name?.trim() || 'سير عمل جديد',
        description: dto.description?.trim() || null,
        definition: (dto.definition ?? DEFAULT_DEFINITION) as object,
      },
    });
  }

  async updateForUser(userId: string, id: string, dto: UpdateBusinessWorkflowDto) {
    await this.getForUser(userId, id);
    return this.prisma.businessWorkflow.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() || 'سير عمل جديد' } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.definition !== undefined ? { definition: dto.definition as object } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async deleteForUser(userId: string, id: string) {
    await this.getForUser(userId, id);
    await this.prisma.businessWorkflow.delete({ where: { id } });
    return { success: true };
  }
}
