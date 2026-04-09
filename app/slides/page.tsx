export default function SlidesPage() {
  return (
    <section className="panel">
      <h2>Content Slides</h2>
      <p className="meta">Route: /slides</p>
      <p className="meta">Group-scoped content slides are listed on the dashboard only.</p>
      <p className="meta">Supported templates: text.</p>
      <form action="/edit-slide/new?template=text">
        <button type="submit">Create Text Slide</button>
      </form>
      <form action="/api/slides/export-json" method="get">
        <button type="submit">Export JSON File</button>
      </form>
    </section>
  );
}
