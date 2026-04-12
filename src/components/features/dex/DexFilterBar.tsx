'use client';

import { Pill } from '@/components/ui/Pill';
import type { FilterType } from '@/lib/dex-types';

const FILTERS: FilterType[] = ['All', 'Today', 'Yesterday', 'This Week', 'This Month', 'This Year'];

interface DexFilterBarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  availablePairs: string[];
  selectedPairs: string[];
  onSelectedPairsChange: (pairs: string[]) => void;
}

export function DexFilterBar({
  activeFilter,
  onFilterChange,
  availablePairs,
  selectedPairs,
  onSelectedPairsChange,
}: DexFilterBarProps) {
  const togglePair = (pair: string) => {
    if (selectedPairs.includes(pair)) {
      onSelectedPairsChange(selectedPairs.filter(p => p !== pair));
    } else {
      onSelectedPairsChange([...selectedPairs, pair]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Time Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <Pill key={f} active={activeFilter === f} onClick={() => onFilterChange(f)}>
            {f}
          </Pill>
        ))}
      </div>

      {/* Pair Filters (only show when pairs exist) */}
      {availablePairs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availablePairs.map(pair => (
            <Pill
              key={pair}
              active={selectedPairs.includes(pair)}
              onClick={() => togglePair(pair)}
            >
              {pair}
            </Pill>
          ))}
        </div>
      )}
    </div>
  );
}
