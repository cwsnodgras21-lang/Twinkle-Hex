"use client";

import { useState, useTransition } from "react";
import { toggleDailyTaskAction } from "@/app/admin/ops-actions";
import type { DailyTask } from "@/types/admin";

export function TodayPlanCard({ tasks }: { tasks: DailyTask[] }) {
  const [items, setItems] = useState(tasks);
  const [, startTransition] = useTransition();

  function toggle(id: string, done: boolean) {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
    startTransition(() => {
      toggleDailyTaskAction(id, done);
    });
  }

  return (
    <section className="bg-dash-surface border border-dash-border rounded-xl px-[18px] pt-[18px] pb-4">
      <h2 className="font-display text-[14.5px] font-semibold mb-0.5 text-dash-text">Today&apos;s Plan</h2>
      <p className="text-[11.5px] text-dash-muted mb-3">Top priorities for today.</p>
      {items.length === 0 ? (
        <p className="text-[12.5px] text-dash-muted">Nothing planned yet.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id, !t.done)}
              className="flex items-start gap-2.5 text-left"
            >
              <div
                className={`w-[15px] h-[15px] rounded-[4px] border-[1.5px] shrink-0 mt-0.5 flex items-center justify-center ${
                  t.done ? "bg-dash-pink border-dash-pink" : "bg-white border-dash-border"
                }`}
              >
                {t.done && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
              </div>
              <div className="min-w-0 flex flex-col gap-0.5">
                <div
                  className={`text-[12.5px] leading-tight font-semibold ${
                    t.done ? "line-through text-dash-muted" : "text-dash-text"
                  }`}
                >
                  {t.title}
                </div>
                <div className="text-[11px] leading-tight text-dash-muted">
                  {[t.tag, t.time_label].filter(Boolean).join(" · ")}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
