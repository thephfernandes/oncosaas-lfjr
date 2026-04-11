/**
 * Reexport do cliente canônico em `oncology-navigation.ts` (paths e DTOs alinhados ao backend).
 * Mantém o alias `navigationApi` e tipos legados `CreateNavigationStepData` / `UpdateNavigationStepData`.
 */
export {
  oncologyNavigationApi,
  oncologyNavigationApi as navigationApi,
} from './oncology-navigation';

export type {
  NavigationStep,
  JourneyStageParam,
  CreateNavigationStepDto,
  UpdateNavigationStepDto,
} from './oncology-navigation';

export type { CreateNavigationStepDto as CreateNavigationStepData } from './oncology-navigation';
export type { UpdateNavigationStepDto as UpdateNavigationStepData } from './oncology-navigation';
