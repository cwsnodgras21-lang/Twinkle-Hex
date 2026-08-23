"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CalendarEvent } from "@/lib/ops/calendar";
import type { DashboardMonth } from "@/lib/admin/command-center-data";

type Cell =
  | { blank: true }
  | {
      blank: false;
      day: number;
      isToday: boolean;
      events: Array<{ id: string; label: string; href?: string; kind: "release" | "key" }>;
    };

function eventKind(kind: CalendarEvent["kind"]): "release" | "key" {
  return kind === "launch" ? "release" : "key";
}

function buildMonthCells(year: number, month: number, today: string, eventsByDate: Map<string, CalendarEvent[]>): Cell[] {
  const first = new Date(Date.UTC(year, month, 1));
  const startWeekday = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: Cell[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ blank: true });
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const evs = eventsByDate.get(key) ?? [];
    cells.push({
      blank: false,
      day: d,
      isToday: key === today,
      events: evs.map((ev) => ({ id: ev.id, label: ev.title, href: ev.href, kind: eventKind(ev.kind) })),
    });
  }
  while (cells.length % 7 !== 0) cells.push({ blank: true });
  return cells;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarCard({
  months,
  events,
  today,
}: {
  months: DashboardMonth[];
  events: CalendarEvent[];
  today: string;
}) {
  const [monthIndex, setMonthIndex] = useState(0);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const list = map.get(ev.date) ?? [];
      list.push(ev);
      map.set(ev.date, list);
    }
    return map;
  }, [events]);

  const active = months[monthIndex];
  const cells = useMemo(
    () => (active ? buildMonthCells(active.year, active.month, today, eventsByDate) : []),
    [active, today, eventsByDate]
  );

  return (
    <section className="bg-dash-surface border border-dash-border border-t-[3px] border-t-dash-pink rounded-xl px-[22px] pt-5 pb-[22px] flex-[2_1_520px] min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-base font-semibold whitespace-nowrap text-dash-text">3-Month Planning Board</h2>
        <div className="flex gap-1 bg-dash-pinkPale rounded-lg p-[3px]">
          {months.map((m, i) => (
            <button
              key={`${m.year}-${m.month}`}
              type="button"
              onClick={() => setMonthIndex(i)}
              className={`border-none text-[12.5px] font-semibold py-[7px] px-3.5 rounded-md font-sans ${
                i === monthIndex ? "bg-white text-dash-pinkDark" : "bg-transparent text-dash-muted"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-dash-border border border-dash-border rounded-lg overflow-hidden">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="bg-dash-pinkPale py-2 text-center text-[11px] font-bold tracking-wide text-dash-muted"
          >
            {wd}
          </div>
        ))}
        {cells.map((cell, i) =>
          cell.blank ? (
            <div key={i} className="bg-dash-blank min-h-[88px] opacity-50" />
          ) : (
            <div
              key={i}
              className={`min-h-[88px] p-1.5 flex flex-col gap-1 ${cell.isToday ? "bg-dash-pink" : "bg-dash-surface"}`}
            >
              <div className={`text-xs ${cell.isToday ? "font-bold text-white" : "font-medium text-dash-text"}`}>
                {cell.day}
              </div>
              {cell.events.map((ev) => {
                const chip = (
                  <div
                    className={`flex items-center gap-1 rounded px-[5px] py-0.5 ${
                      ev.kind === "release" ? "bg-dash-pinkSoft" : "bg-dash-purpleSoft"
                    }`}
                  >
                    <div
                      className={`w-[5px] h-[5px] rounded-full shrink-0 ${
                        ev.kind === "release" ? "bg-dash-pink" : "bg-dash-purple"
                      }`}
                    />
                    <span
                      className={`text-[10px] font-semibold leading-tight ${
                        ev.kind === "release" ? "text-dash-pinkDark" : "text-dash-purpleDark"
                      }`}
                    >
                      {ev.label}
                    </span>
                  </div>
                );
                return ev.href ? (
                  <Link key={ev.id} href={ev.href}>
                    {chip}
                  </Link>
                ) : (
                  <div key={ev.id}>{chip}</div>
                );
              })}
            </div>
          )
        )}
      </div>
    </section>
  );
}
