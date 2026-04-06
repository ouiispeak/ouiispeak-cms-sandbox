import { loadLevels } from "@/lib/levels";

export default async function LevelsPage() {
  try {
    const levels = await loadLevels("withDefinition");

    return (
      <section className="panel">
        <h2>Levels</h2>
        <p className="meta">Reference page</p>
        <ul className="levelList">
          {levels.map((item) => (
            <li key={item.level_number} id={`level-${item.level_number}`} className="levelItem">
              <h3 className="levelTitle">{item.name}</h3>
              <p className="meta">{item.definition ?? "No definition yet."}</p>
            </li>
          ))}
        </ul>
      </section>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return (
      <section className="panel">
        <h2>Levels</h2>
        <p className="meta">Could not load levels from Supabase.</p>
        <p className="meta">{message}</p>
      </section>
    );
  }
}
