/**
 * Nguồn dữ liệu DUY NHẤT về thành viên gia đình (allowlist email → vai trò).
 * Nếu đổi danh sách này, nhớ đồng bộ `firestore.rules` (hàm isFamilyMember).
 */
export type FamilyRole = 'husband' | 'wife';

export const HUSBAND_EMAILS: readonly string[] = ['lhoaiphuoc@gmail.com', 'phuocbaulam@gmail.com'];
export const WIFE_EMAILS: readonly string[] = ['que7tam@gmail.com', 'dieuhong1013@gmail.com'];

export const ACTOR_STORAGE_KEY = 'family_active_actor';

export function getRoleByEmail(email?: string | null): FamilyRole | null {
  if (!email) return null;
  const e = email.trim().toLowerCase();
  if (HUSBAND_EMAILS.includes(e)) return 'husband';
  if (WIFE_EMAILS.includes(e)) return 'wife';
  return null;
}

export function isFamilyMemberEmail(email?: string | null): boolean {
  return getRoleByEmail(email) !== null;
}

/** Vai trò hiện tại của thiết bị (đã được AuthGate ép theo email đăng nhập). */
export function getActiveActor(): FamilyRole {
  const stored = localStorage.getItem(ACTOR_STORAGE_KEY);
  return stored === 'wife' ? 'wife' : 'husband';
}
