export const HUSBAND_EMAILS = ['lhoaiphuoc@gmail.com', 'phuocbaulam@gmail.com'];
// LƯU Ý: Firebase trả về email ĐÚNG như lúc tạo tài khoản Google (giữ nguyên dấu chấm).
// Tài khoản thật của vợ là "dieuhong.1013@gmail.com" (có dấu chấm) — xác minh từ Firebase Auth ngày 31/10/2026.
export const WIFE_EMAILS = ['que7tam@gmail.com', 'dieuhong.1013@gmail.com'];

export const ALLOWED_EMAILS = [...HUSBAND_EMAILS, ...WIFE_EMAILS];

/**
 * Chuẩn hoá email để so khớp: chữ thường, và với Gmail thì bỏ dấu chấm ở phần tên
 * (Gmail coi "dieu.hong1013" và "dieuhong1013" là cùng một hộp thư).
 */
export const normalizeEmail = (email: string | null | undefined): string => {
  if (!email) return '';
  const lower = email.trim().toLowerCase();
  const at = lower.lastIndexOf('@');
  if (at < 0) return lower;
  let local = lower.slice(0, at);
  let domain = lower.slice(at + 1);
  if (domain === 'googlemail.com') domain = 'gmail.com';
  if (domain === 'gmail.com') {
    local = local.split('+')[0].replace(/\./g, '');
  }
  return `${local}@${domain}`;
};

const NORMALIZED_HUSBAND = HUSBAND_EMAILS.map(normalizeEmail);
const NORMALIZED_WIFE = WIFE_EMAILS.map(normalizeEmail);

export const isAllowedEmail = (email: string | null | undefined): boolean => {
  const n = normalizeEmail(email);
  return !!n && (NORMALIZED_HUSBAND.includes(n) || NORMALIZED_WIFE.includes(n));
};

export const getRoleByEmail = (email: string | null | undefined): 'husband' | 'wife' | null => {
  const n = normalizeEmail(email);
  if (!n) return null;
  if (NORMALIZED_HUSBAND.includes(n)) return 'husband';
  if (NORMALIZED_WIFE.includes(n)) return 'wife';
  return null;
};

export const getActiveActor = (): 'husband' | 'wife' => {
  return (localStorage.getItem('family_active_actor') as 'husband' | 'wife') || 'husband';
};
