import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getRoleByEmail, 
  getActiveActor, 
  isAllowedEmail,
  normalizeEmail,
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

  it('maps both wife accounts to "wife" (que7tam + dieuhong.1013 as stored by Firebase Auth)', () => {
    expect(getRoleByEmail('que7tam@gmail.com')).toBe('wife');
    expect(getRoleByEmail('Que7Tam@gmail.com')).toBe('wife');
    // Firebase trả về đúng dạng có dấu chấm của tài khoản thật
    expect(getRoleByEmail('dieuhong.1013@gmail.com')).toBe('wife');
    expect(getRoleByEmail('DieuHong.1013@gmail.com')).toBe('wife');
    // Gmail bỏ qua dấu chấm -> dạng không chấm cũng hợp lệ
    expect(getRoleByEmail('dieuhong1013@gmail.com')).toBe('wife');
    expect(getRoleByEmail('DIEUHONG1013@GMAIL.COM')).toBe('wife');
    expect(isAllowedEmail('dieuhong.1013@gmail.com')).toBe(true);
  });

  it('does NOT allow look-alike non-gmail domains', () => {
    expect(getRoleByEmail('dieuhong1013@gmail.co')).toBeNull();
    expect(isAllowedEmail('dieuhong.1013@gmail.co')).toBe(false);
    expect(isAllowedEmail('que7tam@gmail.com.evil.com')).toBe(false);
  });

  it('normalizes gmail addresses (dots, case, googlemail)', () => {
    expect(normalizeEmail('Dieu.Hong.1013@Gmail.com')).toBe('dieuhong1013@gmail.com');
    expect(normalizeEmail('que7tam@googlemail.com')).toBe('que7tam@gmail.com');
    expect(normalizeEmail('a.b@other.com')).toBe('a.b@other.com');
  });

  it('returns null for unauthorized emails or invalid inputs', () => {
    expect(getRoleByEmail('stranger@gmail.com')).toBeNull();
    expect(getRoleByEmail('hacker@domain.com')).toBeNull();
    expect(getRoleByEmail(null)).toBeNull();
    expect(getRoleByEmail(undefined)).toBeNull();
    expect(getRoleByEmail('')).toBeNull();
    expect(isAllowedEmail(null)).toBe(false);
  });

  it('contains all required family emails in ALLOWED_EMAILS', () => {
    expect(HUSBAND_EMAILS).toContain('lhoaiphuoc@gmail.com');
    expect(WIFE_EMAILS).toContain('dieuhong.1013@gmail.com');
    expect(ALLOWED_EMAILS).toContain('lhoaiphuoc@gmail.com');
    expect(ALLOWED_EMAILS).toContain('phuocbaulam@gmail.com');
    expect(ALLOWED_EMAILS).toContain('que7tam@gmail.com');
    expect(ALLOWED_EMAILS).toContain('dieuhong.1013@gmail.com');
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
