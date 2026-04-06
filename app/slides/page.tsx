export default function SlidesPage() {
  return (
    <section className="panel">
      <h2>Slides</h2>
      <p className="meta">Route: /slides</p>
      <p className="meta">Slides are listed on the dashboard only.</p>
      <form action="/edit-slide/new">
        <button type="submit">Create Slide</button>
      </form>
      <form action="/api/slides/export-json" method="get">
        <button type="submit">Export JSON File</button>
      </form>
    </section>
  );
}
