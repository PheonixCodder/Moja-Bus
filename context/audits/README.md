# Moja Ride — Feature Audits Hub

This directory holds **active feature audits only**. Once all findings in an audit are resolved and the release checklist passes, the audit folder must be deleted. This folder should be empty when no audits are in progress — it is not an archive.

---

## Starting a New Audit

1. Create `context/audits/[feature-name]/` with numbered module files (see structure below).
2. Log open findings in `context/progress-tracker.md` under the relevant feature.
3. Work through phase files one at a time, marking each complete.
4. When all findings are resolved and the release checklist passes — **delete the entire audit folder**.

## Standard Audit File Structure

```
context/audits/[feature-name]/
├── README.md                   # Executive summary, index, top actions
├── 01-system-map.md            # Component inventory and data flows
├── 02-findings.md              # Annotated findings list
├── 03-[domain]-audit.md        # Additional deep-dive modules as needed
├── [N-1]-findings-catalog.md   # Severity-ranked gap register (P0–P3)
├── [N]-release-checklist.md    # Pre-release gate (A/B/C probes)
└── phase-00.md ... phase-NN.md # One file per execution phase
```

---

## Severity Definitions

| Level | Label | Meaning |
| :--- | :--- | :--- |
| **P0** | Blocker | Prevents deploy or causes data loss. Fix immediately. |
| **P1** | Critical | Security issue, incorrect financial math, or broken core user flow. |
| **P2** | Major | Significant missing feature or reliability gap. |
| **P3** | Polish | Minor UX, copy, or observability gap. |

> [!IMPORTANT]
> This directory is for **active audits only**. Delete the folder when all findings are resolved.
