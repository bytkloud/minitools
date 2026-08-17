// Shared signatory names for all tools that render signatures.
//
// The three signature titles are common across every form, so the common-name
// suggestions live here in one place. Free typing is always allowed in the
// form — these arrays only populate the selectable dropdown suggestions.
//
// Fill in the names per title as needed.

export type SignatureKey = 'areaEngineer' | 'zonalEngineer' | 'managerMotor'

// Assistant Area Engineers are substitutes for the Area Engineer — they can
// sign wherever an Area Engineer signature is required, but the printed
// label should read "Assistant Area Engineer" instead of "Area Engineer".
export const ASSISTANT_AREA_ENGINEER_NAMES: string[] = [
  'Ashan Pradeep',
  'Paul Crishanth',
  'Sameera Hasantha',
  'Aravinda Upul',
  'Sudesh Kumara',
  'Thilanka Sameera',
]

export const SIGNATURE_NAMES: Record<SignatureKey, string[]> = {
  areaEngineer: [
    "Asanka Gimhan",
    "Janitha Kasun",
    "Sewwanda Nadeeshan",
    "Prasanna Ekanayake",
    "Noyel Sampath",
    "Mahendra Saumyan",
    ...ASSISTANT_AREA_ENGINEER_NAMES,
  ],
  zonalEngineer: [
    "Kasun Rathnayake",
    "Suranjan Jayasundara",
    "Jayantha Dissanayake"
  ],
  managerMotor: [
    "Kosala Abeysinghe"
  ],
}

export function isAssistantAreaEngineer(name: string): boolean {
  const trimmed = name.trim().toLowerCase()
  if (!trimmed) return false
  return ASSISTANT_AREA_ENGINEER_NAMES.some((n) => n.toLowerCase() === trimmed)
}

// Returns "Assistant Area Engineer" when the entered name is one of the
// assistant area engineers, otherwise falls back to the form's default label.
export function resolveSignatureLabel(key: SignatureKey, name: string, defaultLabel: string): string {
  if (key === 'areaEngineer' && isAssistantAreaEngineer(name)) return 'Assistant Area Engineer'
  return defaultLabel
}
