import { PartialType } from '@nestjs/mapped-types';
import { CreateCancerDiagnosisDto } from './create-cancer-diagnosis.dto';

export class UpdateCancerDiagnosisDto extends PartialType(
  CreateCancerDiagnosisDto
) {}