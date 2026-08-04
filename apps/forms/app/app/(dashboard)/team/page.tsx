import { TeamView } from '@/components/team/team-view';

export default function TeamPage() {
  return (
    <section className="dashboard-page flex flex-col gap-5 sm:gap-6 dashboard-brand">
      <TeamView />
    </section>
  );
}
