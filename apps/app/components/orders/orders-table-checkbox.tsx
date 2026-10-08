'use client';

import type { MouseEvent } from 'react';
import { Checkbox } from '@heroui/react';

interface OrdersTableCheckboxProps {
  'aria-label': string;
  isSelected: boolean;
  isIndeterminate?: boolean;
  onChange: (selected: boolean) => void;
  onClick?: (event: MouseEvent) => void;
}

export function OrdersTableCheckbox({
  'aria-label': ariaLabel,
  isSelected,
  isIndeterminate,
  onChange,
  onClick,
}: OrdersTableCheckboxProps) {
  return (
    <div
      className="flex items-center justify-center"
      onClick={onClick}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Checkbox
        aria-label={ariaLabel}
        isSelected={isSelected}
        isIndeterminate={isIndeterminate}
        onChange={onChange}
        variant="secondary"
      >
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
        </Checkbox.Content>
      </Checkbox>
    </div>
  );
}
