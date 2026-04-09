export default function TitleSlidesPage() {
  return (
    <section className="panel">
      <h2>Title Slides</h2>
      <p className="meta">Route: /title-slides</p>
      <p className="meta">Title slides are lesson-scoped boundary slides listed on the dashboard only.</p>
      <form action="/edit-title-slide/new">
        <button type="submit">Create Title Slide</button>
      </form>
      <form action="/api/title-slides/export-json" method="get">
        <button type="submit">Export JSON File</button>
      </form>
    </section>
  );
}
