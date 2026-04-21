'use client';

import { AlertTriangle, CircleAlert } from 'lucide-react';

type StateSeverity = 'info' | 'warning' | 'error';

interface Props {
  severity: StateSeverity;
  message: string;
  actionLabel?: 'Retry' | 'Refresh';
  onAction?: () => void;
  lastUpdated?: Date | null;
  showStaleBadge?: boolean;
}

export function StateNotice({
  severity,
  message,
  actionLabel,
  onAction,
  lastUpdated,
  showStaleBadge = false,
}: Props) {
  const isWarningOrError = severity === 'warning' || severity === 'error';
  const Icon = severity === 'warning' ? AlertTriangle : CircleAlert;
  const severityLabel = severity === 'warning' ? 'Warning' : severity === 'error' ? 'Error' : 'Info';

  return (
    <div className={`state-notice state-${severity}`}>
      <div className="flex items-start gap-2">
        {isWarningOrError ? <Icon size={14} className="state-notice-icon mt-[1px]" aria-hidden="true" /> : null}
        <div className="min-w-0">
          {isWarningOrError ? (
            <p className="state-severity-label">{severityLabel}</p>
          ) : null}
          <p className="state-notice-text">{message}</p>
        </div>
      </div>

      {actionLabel || lastUpdated || showStaleBadge ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          {actionLabel && onAction ? (
            <button type="button" onClick={onAction} className="state-action-btn">
              {actionLabel}
            </button>
          ) : (
            <span />
          )}

          <div className="state-meta-row">
            {lastUpdated ? (
              <span className="state-timestamp">{formatLastUpdated(lastUpdated)}</span>
            ) : null}
            {showStaleBadge ? <span className="state-stale-badge">Data may be stale</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function formatLastUpdated(date: Date): string {
  const time = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  }).format(date);
  return `Last updated: ${time} IST`;
}

