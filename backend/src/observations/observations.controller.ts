import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ObservationsService } from './observations.service';
import { CreateObservationDto } from './dto/create-observation.dto';
import { UpdateObservationDto } from './dto/update-observation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@generated/prisma/client';

@Controller('observations')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.ONCOLOGIST,
  UserRole.DOCTOR,
  UserRole.NURSE_CHIEF,
  UserRole.NURSE,
  UserRole.COORDINATOR
)
export class ObservationsController {
  constructor(private readonly observationsService: ObservationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createObservationDto: CreateObservationDto, @Request() req) {
    return this.observationsService.create(
      createObservationDto,
      req.user.tenantId
    );
  }

  @Get()
  findAll(
    @Request() req,
    @Query('patientId') patientId?: string,
    @Query('code') code?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.observationsService.findAll(
      req.user.tenantId,
      patientId,
      code,
      {
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      }
    );
  }

  @Get('unsynced')
  findUnsynced(
    @Request() req,
    @Query('limit') limit?: string
  ) {
    const parsed =
      limit != null && limit !== '' ? parseInt(limit, 10) : undefined;
    return this.observationsService.findUnsynced(req.user.tenantId, {
      limit:
        parsed !== undefined && Number.isFinite(parsed) && parsed > 0
          ? parsed
          : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.observationsService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateObservationDto: UpdateObservationDto,
    @Request() req
  ) {
    return this.observationsService.update(
      id,
      updateObservationDto,
      req.user.tenantId
    );
  }

  @Patch(':id/sync')
  @HttpCode(HttpStatus.OK)
  markAsSynced(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('fhirResourceId') fhirResourceId: string,
    @Request() req
  ) {
    return this.observationsService.markAsSynced(
      id,
      req.user.tenantId,
      fhirResourceId
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.observationsService.remove(id, req.user.tenantId);
  }
}
