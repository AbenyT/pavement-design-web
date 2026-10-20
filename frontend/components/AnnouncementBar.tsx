'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ChevronRight, Close, LogoMark } from './icons';

const ITEMS = ['AASHTO 1993 structural number method', 'Layer-by-layer checks', 'Report-ready cross-sections', 'Excel & CSV export'];

/** Thin black strip above the header (closes for the rest of the visit). */
export function AnnouncementBar() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="print-hidden bg-[#0c0c0e] text-white">
      <div className="mx-auto flex h-10 max-w-7xl items-center gap-4 px-4 text-[13px] sm:px-6">
        <LogoMark size={16} className="shrink-0 text-white" />
        <p className="shrink-0 font-medium">Free during beta</p>
        <ul className="no-scrollbar hidden min-w-0 flex-1 items-center gap-5 overflow-x-auto whitespace-nowrap text-white/70 md:flex">
          {ITEMS.map((item) => (
            <li key={item} className="flex items-center gap-5">
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/35" />{item}
            </li>
          ))}
        </ul>
        <span className="flex-1 md:hidden" />
        <Link href="/calculator"
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-white px-3 text-xs font-semibold text-[#111113] transition hover:bg-white/90">
          Try the calculator <ChevronRight size={13} strokeWidth={2.4} />
        </Link>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close announcement"
          className="-mr-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white">
          <Close size={16} />
        </button>
      </div>
    </div>
  );
}
