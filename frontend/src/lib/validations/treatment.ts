import { z } from 'zod';

export const treatmentTypeSchema = z.enum([
  'CHEMOTHERAPY',
  'RADIOTHERAPY',
  'SURGERY',
  'COMBINED',
  'IMMUNOTHERAPY',
  'TARGETED_THERAPY',
  'HORMONE_THERAPY',
]);

export const treatmentIntentSchema = z.enum([
  'CURATIVE',
  'PALLIATIVE',
  'ADJUVANT',
  'NEOADJUVANT',
  'UNKNOWN',
]);

export const treatmentStatusSchema = z.enum([
  'PLANNED',
  'ONGOING',
  'COMPLETED',
  'SUSPENDED',
  'CANCELLED',
]);

export const treatmentResponseSchema = z.enum([
  'COMPLETE_RESPONSE',
  'PARTIAL_RESPONSE',
  'STABLE_DISEASE',
  'PROGRESSIVE_DISEASE',
  'NOT_EVALUATED',
]);

export const createTreatmentSchema = z.object({
  diagnosisId: z.string().min(1, 'Diagnóstico é obrigatório'),
  treatmentType: treatmentTypeSchema,
  treatmentName: z.string().optional(),
  protocol: z.string().optional(),
  line: z.number().int().min(1).optional(),
  intent: treatmentIntentSchema.optional(),
  startDate: z.string().optional(),
  plannedEndDate: z.string().optional(),
  actualEndDate: z.string().optional(),
  cyclesPlanned: z.number().int().min(1).optional(),
  cyclesCompleted: z.number().int().min(0).optional(),
  status: treatmentStatusSchema.optional(),
  response: treatmentResponseSchema.optional(),
  responseDate: z.string().optional(),
  toxicities: z.any().optional(),
  doseModifications: z.any().optional(),
  notes: z.string().optional(),
});

export type CreateTreatmentFormData = z.infer<typeof createTreatmentSchema>;
export type UpdateTreatmentFormData = Partial<CreateTreatmentFormData>;
