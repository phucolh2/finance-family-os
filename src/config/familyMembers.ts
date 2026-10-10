export const HUSBAND_EMAILS = ['lhoaiphuoc@gmail.com', 'phuocbaulam@gmail.com'];
export const WIFE_EMAILS = ['que7tam@gmail.com', 'dieuhong1013@gmail.com', 'dieuhong1013@gmail.co'];

export const ALLOWED_EMAILS = [...HUSBAND_EMAILS, ...WIFE_EMAILS];

export const getRoleByEmail = (email: string | null | undefined): 'husband' | 'wife' | null => {
  if (!email) return null;
  const lowerEmail = email.toLowerCase();
  if (HUSBAND_EMAILS.includes(lowerEmail)) return 'husband';
  if (WIFE_EMAILS.includes(lowerEmail)) return 'wife';
  return null;
};

export const getActiveActor = (): 'husband' | 'wife' => {
  return (localStorage.getItem('family_active_actor') as 'husband' | 'wife') || 'husband';
};
