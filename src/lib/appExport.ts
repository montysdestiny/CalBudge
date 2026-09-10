export type ExternalAppId = 'myfitnesspal' | 'macrofactor' | 'calai';

export interface ExternalApp {
  id: ExternalAppId;
  name: string;
  initials: string;
  destination: string;
}

// Letter-monogram badges, not the apps' own trademarked logos — CalBudge
// has no affiliation or partnership with any of these.
export const EXTERNAL_APPS: ExternalApp[] = [
  { id: 'myfitnesspal', name: 'MyFitnessPal', initials: 'MFP', destination: 'Goals → Nutrition Goals → Custom' },
  { id: 'macrofactor', name: 'MacroFactor', initials: 'MF', destination: 'Nutrition → Targets → Custom Target' },
  { id: 'calai', name: 'Cal AI', initials: 'CA', destination: 'Settings → Adjust Goals' },
];

export interface MacroTargets {
  calories: number;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}

export function formatTargetsForApp(appId: ExternalAppId, targets: MacroTargets): string {
  const app = EXTERNAL_APPS.find(a => a.id === appId);
  const lines = [`Calories: ${targets.calories} kcal`];
  if (targets.proteinG != null) lines.push(`Protein: ${targets.proteinG}g`);
  if (targets.carbsG != null) lines.push(`Carbs: ${targets.carbsG}g`);
  if (targets.fatG != null) lines.push(`Fat: ${targets.fatG}g`);
  if (app) lines.push('', `Enter these in ${app.name} under ${app.destination}.`);
  return lines.join('\n');
}

export async function copyTargetsForApp(appId: ExternalAppId, targets: MacroTargets) {
  await navigator.clipboard.writeText(formatTargetsForApp(appId, targets));
}
