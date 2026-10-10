import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getRoleByEmail, 
  getActiveActor, 
  HUSBAND_EMAILS, 
  WIFE_EMAILS, 
  ALLOWED_EMAILS 
} from './familyMembers';

describe('familyMembers configuration & authorization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('correctly maps husband emails to "husband" regardless of case', () => {
    expect(getRoleByEmail('lhoaiphuoc@gmail.com')).toBe('husband');
    expect(getRoleByEmail('LHOAIPHUOC@GMAIL.COM')).toBe('husband');
    expect(getRoleByEmail('phuocbaulam@gmail.com')).toBe('husband');
    expect(getRoleByEmail('PhuocBauLam@gmail.com')).toBe('husband');
  });

  it('correctly maps wife emails to "wife" including dieuhong1013@gmail.com and .co', () => {
    expect(getRoleByEmail('que7tam@gmail.com')).toBe('wife');
    expect(getRoleByEmail('Que7Tam@gmail.com')).toBe('wife');
    expect(getRoleByEmail('dieuhong1013@gmail.com')).toBe('wife');
    expect(getRoleByEmail('DieuHong1013@gmail.com')).toBe('wife');
    expect(getRoleByEmail('DIEUHONG1013@GMAIL.COM')).toBe('wife');
    // Also supports .co variation
    expect(getRoleByEmail('dieuhong1013@gmail.co')).toBe('wife');
    expect(getRoleByEmail('Dieuhong1013@gmail.co')).toBe('wife');
  });

  it('returns null for unauthorized emails or invalid inputs', () => {
    expect(getRoleByEmail('stranger@gmail.com')).toBeNull();
    expect(getRoleByEmail('hacker@domain.com')).toBeNull();
    expect(getRoleByEmail(null)).toBeNull();
    expect(getRoleByEmail(undefined)).toBeNull();
    expect(getRoleByEmail('')).toBeNull();
  });

  it('contains all required family emails in ALLOWED_EMAILS', () => {
    expect(HUSBAND_EMAILS).toContain('lhoaiphuoc@gmail.com');
    expect(WIFE_EMAILS).toContain('dieuhong1013@gmail.com');
    expect(ALLOWED_EMAILS).toContain('lhoaiphuoc@gmail.com');
    expect(ALLOWED_EMAILS).toContain('phuocbaulam@gmail.com');
    expect(ALLOWED_EMAILS).toContain('que7tam@gmail.com');
    expect(ALLOWED_EMAILS).toContain('dieuhong1013@gmail.com');
    expect(ALLOWED_EMAILS).toContain('dieuhong1013@gmail.co');
  });

  it('getActiveActor defaults to husband when localStorage is empty', () => {
    expect(getActiveActor()).toBe('husband');
  });

  it('getActiveActor reads correctly from localStorage', () => {
    localStorage.setItem('family_active_actor', 'wife');
    expect(getActiveActor()).toBe('wife');
    localStorage.setItem('family_active_actor', 'husband');
    expect(getActiveActor()).toBe('husband');
  });
});
