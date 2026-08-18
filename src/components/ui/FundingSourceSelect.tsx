import React, { useMemo, useEffect } from 'react';
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
  allowEmpty?: boolean;
  emptyLabel?: string;
}

export const FundingSourceSelect: React.FC<FundingSourceSelectProps> = ({
  value,
  onChange,
  label = 'Nguồn chi trả',
  disabled = false,
  targetPeriodKey,
  allowEmpty = false,
  emptyLabel = '-- Không sử dụng --',
}) => {
  const { liquidityBreakdownData } = useLiquidityBreakdown('cumulative', targetPeriodKey);

  const sourceOptions = useMemo(() => {
    const options = liquidityBreakdownData.map(group => ({
      value: group.id,
      label: `${group.name} (Còn: ${formatTableMoneyVNDMillion(group.remaining)})`
    }));
    if (allowEmpty) {
      return [{ value: '', label: emptyLabel }, ...options];
    }
    return options;
  }, [liquidityBreakdownData, allowEmpty, emptyLabel]);

  useEffect(() => {
    if (sourceOptions.length > 0) {
      const isValid = sourceOptions.some(opt => opt.value === value);
      if (!isValid) {
        onChange(sourceOptions[0].value);
      }
    }
  }, [value, sourceOptions, onChange]);

  return (
    <div className="relative">
      <div className="absolute -top-1 left-24">
         <HelpTooltip text="Số dư 'Còn' hiển thị quỹ lũy kế khả dụng thực tế của nhóm tính đến tháng đang quan sát." />
      </div>
      <Select
        label={label}
        value={value}
        onChange={(e) => { onChange(e.target.value); }}
        options={sourceOptions}
        disabled={disabled}
      />
    </div>
  );
};
