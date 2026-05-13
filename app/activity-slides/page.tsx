const CREATE_ACTIVITY_IDS = [
  "ACT-001",
  "ACT-002",
  "ACT-003",
  "ACT-004",
  "ACT-005",
  "ACT-009",
  "ACT-010",
  "ACT-011",
  "ACT-012",
  "ACT-013",
  "ACT-014",
  "ACT-015",
  "ACT-016",
  "ACT-017",
  "ACT-018",
  "ACT-019",
  "ACT-020",
  "ACT-021",
  "ACT-022",
  "ACT-023",
  "ACT-024",
  "ACT-025",
  "ACT-026",
] as const;

export default function ActivitySlidesPage() {
  return (
    <section className="panel">
      <h2>Activity Slides</h2>
      <p className="meta">Route: /activity-slides</p>
      <p className="meta">Group-scoped activity slides are listed on the dashboard only.</p>
      <p className="meta">Configured activity profiles: ACT-001..005 and ACT-009..026.</p>
      {CREATE_ACTIVITY_IDS.map((activityId) => {
        const profile = activityId.replace("ACT-", "act-");
        return (
          <div key={activityId} className="panelActions">
            <form action={`/edit-activity-slide/new?profile=${profile}`}>
              <button type="submit">Create {activityId} Activity Slide</button>
            </form>
            <form action="/api/activity-slides/export-json" method="get">
              <input type="hidden" name="profile" value={profile} />
              <button type="submit">Export {activityId} JSON File</button>
            </form>
          </div>
        );
      })}
    </section>
  );
}
