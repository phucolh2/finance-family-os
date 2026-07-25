import React from 'react';
import type { SinkingFund } from '../../../types/finance';
import type { FundingSourceId } from '../../../constants/fundingSources';

export interface DynamicSource {
  id: string;
  label: string;
  balance: number;
}

export interface FundCardProps {
  fund: SinkingFund;
  balance: number;
  progress: number;
  totalDisbursed: number;
  isDisbursing: boolean;
  expandedFundId: string | null;
  setExpandedFundId: (id: string | null) => void;
  onEdit: () => void;
  onDelete: () => void;
  onDisburse: () => void;
  renderDisburseForm: (fund: SinkingFund) => React.ReactNode;
  renderCashflowDetails: (fund: SinkingFund) => React.ReactNode;
  dynamicSources?: DynamicSource[];
  FUNDING_SOURCES: Record<FundingSourceId, any>;
  filterFundType: string;
  formatMoney: (val: number) => string;
}
