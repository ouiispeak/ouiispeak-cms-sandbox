export default function LessonsPage() {
  return (
    <section className="panel">
      <h2>Lessons</h2>
      <p className="meta">Route: /lessons</p>
      <form action="/edit-lesson/new">
        <button type="submit">Create Lesson</button>
      </form>
      <form action="/api/lessons/export-json" method="get">
        <button type="submit">Export JSON File</button>
      </form>
    </section>
  );
}
