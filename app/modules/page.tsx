export default function ModulesPage() {
  return (
    <section className="panel">
      <h2>Modules</h2>
      <p className="meta">Route: /modules</p>
      <form action="/edit-module/new">
        <button type="submit">Create Module</button>
      </form>
      <form action="/api/modules/export-json" method="get">
        <button type="submit">Export JSON File</button>
      </form>
    </section>
  );
}
