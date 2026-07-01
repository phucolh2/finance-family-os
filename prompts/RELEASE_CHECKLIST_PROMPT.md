# RELEASE CHECKLIST PROMPT

Run final release review.

Steps:
1. npm run build
2. grep for "2035"
3. grep for "Tài sản phụ"
4. grep for hardcoded default money values: 23.2, 32, 8.8
5. test import/export
6. test LocalStorage reset
7. test income 80 → investment 32
8. test income 100 → investment 40
9. test child 2031 scenario
10. test projection start date change

Return:
- pass/fail
- issues
- files needing fix
