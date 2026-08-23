import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { CalendarCard } from "@/components/admin/dashboard/CalendarCard";
import { TodayPlanCard } from "@/components/admin/dashboard/TodayPlanCard";
import { AtRiskCard, StatsRow, SwatchersCard } from "@/components/admin/dashboard/DashboardCards";
import { loadDashboardData } from "@/lib/admin/command-center-data";
import { getCurrentUser } from "@/lib/auth/helpers";

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(user: Awaited<ReturnType<typeof getCurrentUser>>): string {
  const fullName = (user?.user_metadata as { full_name?: string } | undefined)?.full_name;
  if (fullName) return fullName.split(" ")[0];
  if (user?.email) return user.email.split("@")[0];
  return "there";
}

export default async function AdminDashboardPage() {
  const [data, user] = await Promise.all([loadDashboardData(), getCurrentUser()]);
  const now = new Date(`${data.today}T00:00:00Z`);
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

  return (
    <>
      <AdminTopbar />
      <div className="px-7 pt-7 pb-10 flex flex-col gap-5">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="font-display m-0 text-2xl font-semibold text-dash-text">
              {greetingForHour(new Date().getHours())}, {firstName(user)}
            </h1>
            <p className="mt-1 text-dash-muted text-[13.5px]">Here&apos;s what&apos;s happening in the studio today.</p>
          </div>
          <div className="font-display text-sm font-semibold bg-dash-surface border border-dash-border rounded-lg px-4 py-2.5 text-dash-pinkDark">
            {dateLabel}
          </div>
        </header>

        <StatsRow stats={data.stats} />

        <div className="flex flex-wrap gap-5 items-start">
          <CalendarCard months={data.months} events={data.events} today={data.today} />
          <div className="flex flex-col gap-4 flex-1 min-w-[280px]">
            <TodayPlanCard tasks={data.tasks} />
            <AtRiskCard atRisk={data.atRisk} />
          </div>
        </div>

        <SwatchersCard swatchers={data.swatchers} />
      </div>
    </>
  );
}
