# MOFA — Motor Officer's Form for Approval

A form used by motor officers to request approval before processing a motor claim.  
Outputs a formatted memo for Print-to-PDF and DOCX download.

---

## Approval Routing

Determined automatically by **ACR (Actual Cost of Repair)** = Labor + Parts.

| ACR (LKR)              | Approval Required              | Salutation in output |
|------------------------|-------------------------------|----------------------|
| Below 500,000          | None                          | *(omitted)*          |
| 500,000 – 750,000      | Zonal Engineer (ZE)           | `Dear ZE,`           |
| Above 750,000          | Manager Motor Engineer (MME)  | `Dear MME,`          |

The approval banner on screen updates in real time as Labor and Parts are typed.

---

## Settlement Basis

Dropdown (always shown in output):

- **Estimate Basis**
- **Full and final Offer**
- **Cash in lieu**
- **Wreck to the Insure Basis**

Drives two conditional items (9 and 10) — see below.

---

## Section 1 — Vehicle Details

| Field                        | Type             | Notes                                    |
|------------------------------|------------------|------------------------------------------|
| Vehicle No                   | Text             |                                          |
| MOI                          | Text             | Month of Insurance / policy number       |
| Model                        | Text             |                                          |
| PAV                          | Currency (LKR)   | Pre-Accident Value                       |
| SUM                          | Currency (LKR)   | Sum Insured                              |
| Under Insurance Penalty %    | Numeric (%)      | Formula TBD — currently manual entry    |

---

## Section 2 — Offer Details

| Field          | Type           | Notes                          |
|----------------|----------------|--------------------------------|
| Labor          | Currency (LKR) |                                |
| Parts          | Currency (LKR) |                                |
| ACR            | Calculated     | = Labor + Parts (auto-computed)|
| Payable Amount | Currency (LKR) |                                |
| Offer Amount   | Currency (LKR) |                                |

---

## Conditional Items (Items 3–10 in output)

Items are numbered sequentially starting from 3, after the two tables.  
Only active/selected items appear in the printed output and DOCX.

| # | Control Type | Label / Text in output | Visibility condition |
|---|---|---|---|
| 3 | Toggle (switch) | Payable amount mention after Deduct Under Insurance and Excess | Always available |
| 4 | Toggle (switch) | No further payments | Always available |
| 5 | Toggle (switch) | Need Customer Consent before settle the claim | Always available |
| 6 | Yes / No select | **Yes** → `Need ARI`  /  **No** → `No need ARI` | Always in output (one of the two) |
| 7 | Yes / No select | **Yes** → `Need Salvages (REF ESTIMATE)`  /  **No** → `No need salvages` | Always in output (one of the two) |
| 8 | Toggle (switch) | Subject to policy condition | Always available |
| 9 | Auto-included | Need to cancel policy (only Wreck to the Insure Basis) | Only when Settlement Basis = **Wreck to the Insure Basis** |
| 10 | Toggle (switch) | Need VAT Invoice | Only when Settlement Basis = **Estimate Basis** |

Items 6 and 7 are **always present** in the output — the Yes/No selection determines which text variant appears.  
Item 9 has no toggle; it is automatically included whenever Wreck basis is selected.

### Further Notes (Item 11)

Free-text textarea. If non-empty, included at the bottom of the output below the numbered items.

---

## Signature Section

Signatures shown depend on ACR level. Each slot has an image upload and a date field.

| ACR range              | Signatures shown                                            |
|------------------------|-------------------------------------------------------------|
| Below 500,000          | Area Engineer                                               |
| 500,000 – 750,000      | Area Engineer + Zonal Engineer                              |
| Above 750,000          | Area Engineer + Zonal Engineer + Manager Motor Engineer     |

---

## Output Formats

### Print to PDF

Screen-only elements hidden via `no-print`:
- Approval banner
- All toggle/Yes-No controls
- Settlement basis dropdown (replaced by plain text)
- Signature upload placeholders

Print-only elements (`print-only`):
- Settlement basis text
- `<ol start="3">` containing only the active conditional items

### DOCX Export (`docx-builder.ts`)

Uses the `docx` v9 library. Same content as Print, structured as:

1. Title block — `MOFA` (centred, bold)
2. Salutation paragraph — `Dear ZE,` / `Dear MME,` (omitted if no approval)
3. Intro paragraph — `Kindly need your approval to Process as [Settlement Basis].`
4. Section heading + table — **1) Vehicle Details Below Mentioned**
5. Section heading + table — **2) Offer Details Below Mentioned**
6. Numbered paragraphs — items 3–10 (only active ones, starting from `3)`)
7. Notes paragraph (if non-empty)
8. Section heading + signature table — **Signatures** (only the applicable columns)

Design tokens (consistent with other reports):

| Token | Value |
|---|---|
| Font | Calibri |
| Body size | 22 half-pts (11 pt) |
| Heading BG | `#F0F0F0`, left border `#333333` |
| Label cell BG | `#F5F5F5` |
| Cell border | `#999999` |
| Page margins | top/right/bottom 1440 twips, left 1800 twips |

Currency values formatted as `LKR 1,500,000` using `en-LK` locale.

---

## Pending / TBD

- **Under Insurance Penalty % formula** — field is currently free-text input; will be auto-calculated once formula is confirmed.
- **Full-resolution photo embeds in DOCX** — if photos are added to the form in future, see CLAUDE.md for the `fileToDocxJpeg` approach.
