import { ContributionHeatmap } from '../components/ContributionHeatmap.jsx';
import { HabitLeaderboard, InsightCards, WeeklyTrend, WeekdayStrip } from '../components/AnalyticsGrid.jsx';
import { useApp } from '../state/AppContext.jsx';

export function AnalyticsPage({ onOpenDetail }) {
  const { dashboard, user } = useApp();

  return (
    <div className="space-y-4">
      <ContributionHeatmap heatmap={dashboard.heatmap} today={dashboard.today} startOfWeek={user.startOfWeek ?? 1} months={dashboard.months} />

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <WeeklyTrend weekly={dashboard.weekly} />
        <WeekdayStrip weekdays={dashboard.weekdays} />
      </div>

      <InsightCards dashboard={dashboard} />

      <HabitLeaderboard habits={dashboard.habits} today={dashboard.today} onOpen={onOpenDetail} />
    </div>
  );
}
