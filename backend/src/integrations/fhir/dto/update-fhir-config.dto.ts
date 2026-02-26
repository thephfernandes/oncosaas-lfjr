import { PartialType } from '@nestjs/mapped-types';
import { CreateFHIRConfigDto } from './create-fhir-config.dto';

export class UpdateFHIRConfigDto extends PartialType(CreateFHIRConfigDto) {}
