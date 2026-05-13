export type LevelRow = {
  level_number: number;
  name: string;
  definition?: string | null;
};

export async function loadLevels(mode: "basic" | "withDefinition" = "withDefinition"): Promise<LevelRow[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const readKey = supabaseServiceRoleKey ?? supabaseAnonKey;

  if (!supabaseUrl || !readKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and read API key (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }

  const selectFields = mode === "basic" ? "level_number,name" : "level_number,name,definition";

  const response = await fetch(
    `${supabaseUrl}/rest/v1/levels?select=${selectFields}&order=level_number.asc`,
    {
      cache: "no-store",
      headers: {
        apikey: readKey,
        Authorization: `Bearer ${readKey}`,
      },
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to load levels (${response.status}): ${body}`);
  }

  return (await response.json()) as LevelRow[];
}
