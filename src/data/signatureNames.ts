// Shared signatory names for all tools that render signatures.
//
// The three signature titles are common across every form, so the common-name
// suggestions live here in one place. Free typing is always allowed in the
// form — these arrays only populate the selectable dropdown suggestions.
//
// Fill in the names per title as needed.

export type SignatureKey = 'areaEngineer' | 'zonalEngineer' | 'managerMotor'

export const SIGNATURE_NAMES: Record<SignatureKey, string[]> = {
  areaEngineer: [
    "Asanka Gimhan",
    "Janitha Kasun",
    "Sewwanda Nadeeshan",
    "Prasanna Ekanayake",
    "Noyel Sampath",
    "Mahendra Saumyan"
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
