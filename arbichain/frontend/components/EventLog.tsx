'use client';

import { useEffect, useRef } from 'react';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'tx' | 'upload' | 'reputation' | 'info' | 'error';
  message: string;
  link?: string;
}

const typeStyles: Record<string, { dot: string; text: string }> = {
  tx: { dot: 'bg-blue-400', text: 'text-blue-400' },
  upload: { dot: 'bg-purple-400', text: 'text-purple-400' },
  reputation: { dot: 'bg-amber-400', text: 'text-amber-400' },
  info: { dot: 'bg-gray-400', text: 'text-gray-400' },
  error: { dot: 'bg-red-400', text: 'text-red-400' },
};

const typeLabels: Record<string, string> = {
  tx: 'TX',
  upload: 'FIL',
  reputation: 'REP',
  info: 'INFO',
  error: 'ERR',
};

export default function EventLog({ entries }: { entries: LogEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#3a3a55] text-sm">
        Waiting for demo actions...
      </div>
    );
  }

  return (
    <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-260px)] pr-1">
      {entries.map((entry) => {
        const style = typeStyles[entry.type] || typeStyles.info;
        return (
          <div key={entry.id} className="flex items-start gap-2 text-xs py-1.5 px-2 rounded hover:bg-[#1a1a2e] animate-slide-in">
            <span className={`${style.dot} w-1.5 h-1.5 rounded-full mt-1.5 shrink-0`} />
            <span className="text-[#3a3a55] w-12 shrink-0 font-mono">{entry.timestamp}</span>
            <span className={`${style.text} w-8 shrink-0 font-mono font-semibold`}>{typeLabels[entry.type]}</span>
            <span className="text-[#a1a1aa] flex-1 break-all">
              {entry.link ? (
                <a href={entry.link} target="_blank" rel="noopener noreferrer" className="hover:text-white underline underline-offset-2">
                  {entry.message}
                </a>
              ) : (
                entry.message
              )}
            </span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
