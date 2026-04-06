export default function GroupsPage() {
  return (
    <section className="panel">
      <h2>Groups</h2>
      <p className="meta">Route: /groups</p>
      <p className="meta">Groups are listed on the dashboard only.</p>
      <form action="/edit-group/new">
        <button type="submit">Create Group</button>
      </form>
      <form action="/api/groups/export-json" method="get">
        <button type="submit">Export JSON File</button>
      </form>
    </section>
  );
}
