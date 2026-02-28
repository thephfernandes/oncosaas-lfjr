import { z } from 'zod';

export const navigationStepStatusSchema = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'OVERDUE',
  'CANCELLED',
  'NOT_APPLICABLE',
]);

export const updateNavigationStepSchema = z.object({
  status: navigationStepStatusSchema.optional(),
  isCompleted: z.boolean().optional(),
  completedAt: z.string().optional(),
  actualDate: z.string().optional(),
  dueDate: z.string().optional(),
  institutionName: z.string().optional(),
  professionalName: z.string().optional(),
  result: z.string().optional(),
  findings: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type UpdateNavigationStepFormData = z.infer<
  typeof updateNavigationStepSchema
>;
