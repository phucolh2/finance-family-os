import React, { useMemo } from 'react';
import { Select } from './Select';
import { useLiquidityBreakdown } from '../../hooks/useLiquidityBreakdown';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import { HelpTooltip } from './HelpTooltip';

interface FundingSourceSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  targetPeriodKey?: string;
}

export const FundingSourceSelect: React.FC<FundingSourceSelectProps> = ({
  value,
  onChange,
  label = 'Nguồn chi trả',
  disabled = false,
  targetPeriodKey,
}) => {
  const { liquidityBreakdownData } = useLiquidityBreakdown('cumulative', targetPeriodKey);

  const sourceOptions = useMemo(() => {
    return liquidityBreakdownData.map(group => ({
      value: group.id,
      label: `${group.name} (Còn: ${formatTableMoneyVNDMillion(group.remaining)})`
    }));
  }, [liquidityBreakdownData]);

  return (
    <div className="relative">
      <div className="absolute -top-1 left-24">
         <HelpTooltip text="Số dư 'Còn' hiển thị quỹ lũy kế khả dụng thực tế của nhóm tính đến tháng đang quan sát." />
      </div>
      <Select
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={sourceOptions}
        disabled={disabled}
      />
    </div>
  );
};
