export { ScriptGenerator } from './script-generator';
export type { GeneratedStep, GeneratedPlan } from './script-generator';

export { PlanBuilder } from './services/plan-builder';
export type { OnboardingInput, UserGoal } from './services/plan-builder';

export { VariableResolver } from './services/variable-resolver';
export type { VariableMap } from './services/variable-resolver';

export { toPowerShell } from './templates/powershell';
export { toBash } from './templates/bash';

export { hardenScript, MARKER_PREFIX } from './harden';
export type { HardenShell, HardenOptions } from './harden';
