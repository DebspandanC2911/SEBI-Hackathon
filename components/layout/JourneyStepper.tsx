"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export interface JourneyState {
  href: string;
  label: string;
  done: boolean;
}

const STORE_KEY = "siim.journeyReached";

/**
 * Journey progress rail. A step turns blue only when BOTH its data condition is
 * met (computed server-side) AND the promoter has actually navigated to at least
 * that step. Data alone is not enough: the draft is pre-generated in the
 * background right after setup, so without this gate every step would light up at
 * once. Tracking the furthest step reached (persisted for the session) makes the
 * rail advance naturally as the user moves Setup -> Evidence -> Intelligence ->
 * Draft, which is what a viewer expects to see.
 */
export default function JourneyStepper({ steps }: { steps: JourneyState[] }) {
  const pathname = usePathname();

  // Furthest step index whose href matches the current path (-1 for pages that
  // are not part of the journey, e.g. the assistant or settings).
  const currentIndex = () => {
    let idx = -1;
    steps.forEach((s, i) => {
      if (pathname === s.href || (s.href !== "/" && pathname.startsWith(`${s.href}/`))) idx = Math.max(idx, i);
    });
    return idx;
  };

  const [reached, setReached] = useState(() => Math.max(0, currentIndex()));

  useEffect(() => {
    const cur = currentIndex();
    let next: number;
    if (cur === 0) {
      // On the journey's start page (Company Setup): reset progress so a fresh
      // run ticks from scratch and does not inherit a previous run's furthest
      // step. This is what stops every step lighting up right after setup.
      next = 0;
    } else {
      let stored = 0;
      try { stored = Number(sessionStorage.getItem(STORE_KEY) ?? "0") || 0; } catch { /* no storage */ }
      // In-journey page: advance the rail. Off-journey page (assistant, settings,
      // cur < 0): keep whatever was already reached.
      next = cur > 0 ? Math.max(stored, cur) : stored;
    }
    setReached(next);
    try { sessionStorage.setItem(STORE_KEY, String(next)); } catch { /* no storage */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const isBlue = (s: JourneyState, i: number) => s.done && i <= reached;
  const doneCount = steps.filter((s, i) => isBlue(s, i)).length;

  return (
    <div className="bg-[#f6f9fc] border-b border-slate-200 px-6 py-2 no-print overflow-x-auto">
      <div className="flex items-center gap-1 max-w-[1400px] mx-auto min-w-[720px]">
        {steps.map((s, i) => {
          const blue = isBlue(s, i);
          return (
            <div key={`${s.href}-${i}`} className="flex items-center flex-1 min-w-0">
              <Link href={s.href} className="group flex items-center gap-1.5 min-w-0">
                <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-colors ${
                  blue
                    ? "bg-gradient-to-br from-blue-600 to-sky-400 text-white"
                    : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
                }`}>
                  {blue ? <Check size={10} strokeWidth={3} /> : i + 1}
                </span>
                <span className={`text-[11px] truncate transition-colors ${blue ? "text-slate-700 font-medium" : "text-slate-400 group-hover:text-slate-600"}`}>
                  {s.label}
                </span>
              </Link>
              {i < steps.length - 1 && (
                <span className={`flex-1 h-px mx-2 ${isBlue(steps[i + 1], i + 1) || blue ? "bg-blue-200" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
        <span className="text-[10px] text-slate-400 shrink-0 pl-2">{doneCount}/{steps.length} done</span>
      </div>
    </div>
  );
}
