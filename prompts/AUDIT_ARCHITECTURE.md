# AUDIT ARCHITECTURE PROMPT

Audit the codebase against:
- PROJECT_MANIFEST.md
- docs/00_PROJECT_RULES.md
- docs/05_SYSTEM_ARCHITECTURE.md
- docs/11_VIBE_CODING_RULES.md

Find:
1. calculations in UI
2. duplicated engine logic
3. hardcoded money
4. hardcoded years
5. scenario-specific formulas
6. missing defensive UI
7. missing LocalStorage migration
8. child 2035 references
9. old category references
10. missing chart tooltip

Return:
- severity
- file
- issue
- recommended fix

Do not fix yet.
