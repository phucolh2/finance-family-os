import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { BudgetTreeNodeRow } from './BudgetTreeNodeRow';
import type { BudgetTreeNode } from '../../types/budget';

const makeNode = (overrides: Partial<BudgetTreeNode> = {}): BudgetTreeNode => ({
  id: 'n1',
  parentId: null,
  level: 0,
  nodeType: 'group',
  groupId: 'g1',
  name: 'Chi phí cần thiết',
  ratioPercent: 10,
  isActive: true,
  sortOrder: 1,
  classification: 'expense',
  children: [],
  ...overrides,
});

const renderRow = (props: Partial<React.ComponentProps<typeof BudgetTreeNodeRow>> & { node: BudgetTreeNode }) => {
  const onUpdate = vi.fn();
  render(
    <DndContext>
      <SortableContext items={[props.node.id]}>
        <BudgetTreeNodeRow
          onUpdate={onUpdate}
          onDelete={() => {}}
          onAddChild={() => {}}
          isExpanded={false}
          onToggleExpand={() => {}}
          {...props}
        />
      </SortableContext>
    </DndContext>
  );
  return onUpdate;
};

describe('BudgetTreeNodeRow input modes', () => {
  it('percent mode (default) keeps legacy behaviour: edits ratioPercent directly', () => {
    const onUpdate = renderRow({ node: makeNode() });
    const input = screen.getByDisplayValue('10') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '12.5' } });
    expect(onUpdate).toHaveBeenCalledWith('n1', { ratioPercent: 12.5 });
  });

  it('percent mode shows equivalent amount when a valid base is given', () => {
    renderRow({ node: makeNode({ ratioPercent: 10 }), allocationBase: 80 });
    expect(screen.getByText(/8 triệu/)).toBeTruthy();
  });

  it('amount mode shows amount derived from ratio and converts typed amount back to percent', () => {
    const onUpdate = renderRow({ node: makeNode({ ratioPercent: 10 }), inputMode: 'amount', allocationBase: 80 });
    const input = screen.getByDisplayValue('8') as HTMLInputElement; // 10% of 80
    fireEvent.change(input, { target: { value: '16' } });
    expect(onUpdate).toHaveBeenCalledWith('n1', { ratioPercent: 20 });
  });

  it('amount mode keeps 2-decimal precision when converting (1.5 trieu @ 80 -> 1.88%)', () => {
    const onUpdate = renderRow({ node: makeNode({ ratioPercent: 10 }), inputMode: 'amount', allocationBase: 80 });
    fireEvent.change(screen.getByDisplayValue('8'), { target: { value: '1.5' } });
    expect(onUpdate).toHaveBeenCalledWith('n1', { ratioPercent: 1.88 });
  });

  it('amount mode falls back to percent input when base is invalid (avoid divide by zero)', () => {
    const onUpdate = renderRow({ node: makeNode({ ratioPercent: 10 }), inputMode: 'amount', allocationBase: 0 });
    const input = screen.getByDisplayValue('10') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '15' } });
    expect(onUpdate).toHaveBeenCalledWith('n1', { ratioPercent: 15 });
  });
});
