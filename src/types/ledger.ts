export type EventStatus = 'active' | 'settled' | 'cancelled' | 'planned';

export interface LifecycleProps {
  endMonth?: number;
  endYear?: number;
  status?: EventStatus;
}

export type EventCategory = 'income' | 'budget_allocation' | 'investment' | 'expense' | 'loan' | 'life_event';

export interface LedgerEvent {
  id: string;
  category: EventCategory;
  name: string;
  
  startMonth: number;
  startYear: number;
  endMonth?: number;
  endYear?: number;
  status: EventStatus;
  
  // References to original data
  refId: string;
  
  amountVnd?: number;
  note?: string;
}
