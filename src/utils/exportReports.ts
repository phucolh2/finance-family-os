import type { AppState, SystemActivityLog } from '../types/finance';

/**
 * Tải file CSV về máy với mã hóa UTF-8 BOM (để mở trong Excel tiếng Việt không bị lỗi font)
 */
function downloadCsv(filename: string, csvContent: string): void {
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Xuất dữ liệu Bức tranh Tài chính Lũy kế (RDPD / Projection Rows) ra CSV
 */
export function exportProjectionCsv(monthlyRows: any[]): void {
  const headers = [
    'Ky (Thang/Nam)',
    'Thu nhap chu dong (tr)',
    'Thu nhap thu dong (tr)',
    'Tong thu nhap (tr)',
    'Chi phi sinh hoat (tr)',
    'Tra no (tr)',
    'Tiet kiem (tr)',
    'Dau tu (tr)',
    'Du phong & Thanh khoan (tr)',
    'Tai san rong uoc tinh (tr)'
  ];

  const rows = monthlyRows.map((r) => [
    `T${r.period.month}/${r.period.year}`,
    (r.activeIncomeMonthly || 0).toFixed(2),
    (r.passiveIncomeMonthly || 0).toFixed(2),
    (r.incomeMonthly || 0).toFixed(2),
    (r.livingExpensesMonthly || r.expensesMonthly || 0).toFixed(2),
    (r.debtPaymentMonthly || 0).toFixed(2),
    (r.savingMonthly || 0).toFixed(2),
    (r.investmentMonthly || 0).toFixed(2),
    (r.liquidityMonthly || 0).toFixed(2),
    (r.netWorth || 0).toFixed(2),
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(`Bao_cao_Tai_chinh_Gia_dinh_${dateStr}.csv`, csvContent);
}

/**
 * Xuất danh mục Sổ Tiết Kiệm & Khoản Nợ ra CSV
 */
export function exportSavingsAndDebtsCsv(state: AppState): void {
  const lines: string[] = [];
  lines.push('=== SO TIET KIEM GIA DINH ===');
  lines.push('Ten so,Tien goc (tr),Lai suat (%/nam),Ky han (thang),Bat dau,Trang thai');
  (state.savingsDeposits || []).forEach(s => {
    lines.push(`"${s.name}",${s.principal},${s.interestRateAnnual},${s.termMonths},T${s.startMonth}/${s.startYear},${s.status}`);
  });

  lines.push('\n=== CONG NO & KHOAN VAY ===');
  lines.push('Ten khoan no,Loai,Du no goc (tr),Lai suat (%/nam),Thoi gian (thang),Bat dau,Trang thai');
  (state.debts || []).forEach(d => {
    lines.push(`"${d.name}",${d.type},${d.principal},${d.interestRateAnnual},${d.termMonths},T${d.startMonth}/${d.startYear},${d.status}`);
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(`So_Tiet_Kiem_Va_No_${dateStr}.csv`, lines.join('\n'));
}

/**
 * Xuất Nhật Ký Hoạt Động Chung Tay (System Activity Logs) ra CSV
 */
export function exportSystemAuditLogsCsv(logs: SystemActivityLog[]): void {
  const headers = ['Thoi gian', 'Nguoi thuc hien', 'Hanh dong', 'Module', 'Chi tiet'];
  const rows = logs.map(l => [
    `"${l.timestamp}"`,
    `"${l.actor.replace(/"/g, '""')}"`,
    `"${l.action}"`,
    `"${l.module}"`,
    `"${l.description.replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(`Nhat_Ky_Chung_Tay_${dateStr}.csv`, csvContent);
}

/**
 * In Báo Cáo Tài Chính (Trình duyệt Print / Lưu PDF)
 */
export function printFinancialReport(): void {
  if (typeof window !== 'undefined') {
    window.print();
  }
}
