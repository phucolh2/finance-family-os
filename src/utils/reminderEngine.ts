import type { AppState } from '../types/finance';

export interface SmartReminderItem {
  id: string;
  type: 'savings' | 'debt' | 'insurance' | 'subscription';
  title: string;
  detail: string;
  dueDate: string;
  amountText?: string;
  urgency: 'critical' | 'warning' | 'info';
}

/**
 * Trích xuất danh sách các việc cần nhắc trong tháng quan sát hoặc thời gian thực
 */
export function getSmartReminders(state: AppState, periodKey?: string): SmartReminderItem[] {
  const reminders: SmartReminderItem[] = [];

  let obsYear: number;
  let obsMonth: number;
  if (periodKey) {
    const [y, m] = periodKey.split('-').map(Number);
    obsYear = y;
    obsMonth = m;
  } else {
    const now = new Date();
    obsYear = now.getFullYear();
    obsMonth = now.getMonth() + 1;
  }

  // 1. Sổ tiết kiệm đáo hạn
  if (state.savingsDeposits) {
    state.savingsDeposits.forEach((dep) => {
      if (dep.status === 'active') {
        const maturityTotalMonths = dep.startYear * 12 + dep.startMonth + dep.termMonths;
        const maturityYear = Math.floor(maturityTotalMonths / 12);
        const maturityMonth = (maturityTotalMonths % 12) || 12;

        if (maturityYear === obsYear && maturityMonth === obsMonth) {
          reminders.push({
            id: `sav_${dep.id}`,
            type: 'savings',
            title: `Đáo hạn Sổ: ${dep.name}`,
            detail: `Sổ kỳ hạn ${dep.termMonths} tháng đáo hạn trong tháng ${obsMonth}/${obsYear}. Xem xét tái tục hoặc tất toán chuyển về Quỹ.`,
            dueDate: `Tháng ${obsMonth}/${obsYear}`,
            amountText: `${dep.principal} triệu VND`,
            urgency: 'warning',
          });
        }
      }
    });
  }

  // 2. Các khoản nợ đến kỳ thanh toán
  if (state.debts) {
    state.debts.forEach((debt) => {
      if (debt.status === 'active') {
        const debtEndTotalMonths = debt.startYear * 12 + debt.startMonth + debt.termMonths;
        const currentTotalMonths = obsYear * 12 + obsMonth;
        const startTotalMonths = debt.startYear * 12 + debt.startMonth;

        if (currentTotalMonths >= startTotalMonths && currentTotalMonths <= debtEndTotalMonths) {
          const monthsLeft = debtEndTotalMonths - currentTotalMonths;
          reminders.push({
            id: `debt_${debt.id}`,
            type: 'debt',
            title: `Thanh toán nợ: ${debt.name}`,
            detail: `Kỳ trả góp hàng tháng (còn ${monthsLeft} tháng nữa kết thúc).`,
            dueDate: `Kỳ T${obsMonth}/${obsYear}`,
            urgency: monthsLeft <= 3 ? 'critical' : 'info',
          });
        }
      }
    });
  }

  // 3. Hợp đồng bảo hiểm
  if (state.insurancePolicies) {
    state.insurancePolicies.forEach((ins) => {
      if (ins.status === 'active') {
        reminders.push({
          id: `ins_${ins.id}`,
          type: 'insurance',
          title: `Bảo hiểm: ${ins.provider} (${ins.insuredPerson})`,
          detail: `Hợp đồng số ${ins.policyNumber}. Đóng định kỳ ${ins.paymentFrequency === 'monthly' ? 'hàng tháng' : 'hàng năm'}.`,
          dueDate: `Định kỳ ${ins.paymentFrequency === 'monthly' ? `T${obsMonth}` : 'Hàng năm'}`,
          amountText: ins.premium ? `${(ins.premium / 1_000_000).toFixed(1)} triệu VND` : undefined,
          urgency: 'info',
        });
      }
    });
  }

  // 4. Dịch vụ định kỳ (Subscription)
  const subConfig = state.toolConfigs?.subscriptionTracker;
  if (subConfig && Array.isArray(subConfig.items)) {
    subConfig.items.forEach((sub: any) => {
      if (sub && sub.nextBillingDate) {
        try {
          const bDate = new Date(sub.nextBillingDate);
          if (bDate.getFullYear() === obsYear && bDate.getMonth() + 1 === obsMonth) {
            reminders.push({
              id: `sub_${sub.id || sub.name}`,
              type: 'subscription',
              title: `Gia hạn: ${sub.name}`,
              detail: `Dịch vụ số/sinh hoạt chu kỳ ${sub.billingCycle === 'monthly' ? 'tháng' : 'năm'}.`,
              dueDate: bDate.toLocaleDateString('vi-VN'),
              amountText: sub.cost ? `${sub.cost.toLocaleString('vi-VN')} đ` : undefined,
              urgency: 'info',
            });
          }
        } catch {
          // ignore date parse
        }
      }
    });
  }

  return reminders;
}

/**
 * Hỗ trợ Web Notification (cho phép thông báo trình duyệt)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const res = await Notification.requestPermission();
    return res === 'granted';
  }
  return false;
}

export function sendBrowserNotification(title: string, body: string): void {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.svg',
      });
    } catch {
      // ignore
    }
  }
}
