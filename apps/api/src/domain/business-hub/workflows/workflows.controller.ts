import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/common/guards/auth/jwt-auth.guard';
import { BusinessWorkflowsService } from './workflows.service';
import {
  CreateBusinessWorkflowDto,
  UpdateBusinessWorkflowDto,
} from './dto/workflow.dto';

@Controller('business/workflows')
@UseGuards(JwtAuthGuard)
export class BusinessWorkflowsController {
  constructor(private readonly workflows: BusinessWorkflowsService) {}

  @Get()
  async list(@Req() req: { user: { id: string } }) {
    const workflows = await this.workflows.listForUser(req.user.id);
    return { workflows };
  }

  @Get(':id')
  async get(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    const workflow = await this.workflows.getForUser(req.user.id, id);
    return {
      workflow: {
        ...workflow,
        definition: workflow.definition as object,
      },
    };
  }

  @Post()
  async create(
    @Req() req: { user: { id: string } },
    @Body() dto: CreateBusinessWorkflowDto,
  ) {
    const workflow = await this.workflows.createForUser(req.user.id, dto);
    return {
      workflow: {
        ...workflow,
        definition: workflow.definition as object,
      },
    };
  }

  @Put(':id')
  async update(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateBusinessWorkflowDto,
  ) {
    const workflow = await this.workflows.updateForUser(req.user.id, id, dto);
    return {
      workflow: {
        ...workflow,
        definition: workflow.definition as object,
      },
    };
  }

  @Delete(':id')
  async remove(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.workflows.deleteForUser(req.user.id, id);
  }
}
