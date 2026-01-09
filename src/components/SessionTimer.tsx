import { useState, useEffect } from 'react';

interface SessionTimerProps {
  expiresAt?: Date;
  onExpired?: () => void;
}

export function SessionTimer({ expiresAt, onExpired }: SessionTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expired');
        setIsExpired(true);
        onExpired?.();
        return;
      }

      // Warning when less than 2 minutes left
      setIsWarning(diff < 2 * 60 * 1000);

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  if (!expiresAt) return null;

  const getColor = () => {
    if (isExpired) return '#ef4444';
    if (isWarning) return '#eab308';
    return '#9ca3af';
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        fontFamily: 'monospace',
        color: getColor(),
      }}
      title="Session time remaining"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span>{timeLeft}</span>
    </div>
  );
}
