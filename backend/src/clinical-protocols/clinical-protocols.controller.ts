import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseUUIDPipe,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { ClinicalProtocolsService } from './clinical-protocols.service';
import { CreateProtocolDto, UpdateProtocolDto } from './dto/protocol.dto';

@Controller('clinical-protocols')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ClinicalProtocolsController {
  private readonly logger = new Logger(ClinicalProtocolsController.name);

  constructor(private readonly protocolsService: ClinicalProtocolsService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.protocolsService.findAll(req.user.tenantId);
  }

  @Get('templates')
  getTemplates() {
    return this.protocolsService.getAvailableTemplates();
  }

  @Get('active/:cancerType')
  async findActive(
    @Param('cancerType') cancerType: string,
    @Request() req: any
  ) {
    return this.protocolsService.findActive(req.user.tenantId, cancerType);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.protocolsService.findOne(id, req.user.tenantId);
  }

  @Post()
  async create(@Body() dto: CreateProtocolDto, @Request() req: any) {
    return this.protocolsService.create(dto, req.user.tenantId);
  }

  @Post('initialize-defaults')
  async initializeDefaults(@Request() req: any) {
    return this.protocolsService.initializeDefaultProtocols(req.user.tenantId);
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProtocolDto,
    @Request() req: any
  ) {
    return this.protocolsService.update(id, dto, req.user.tenantId);
  }
}
