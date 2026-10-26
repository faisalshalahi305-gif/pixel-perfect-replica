import { supabase } from "@/integrations/supabase/client";
import type { Template } from "@/lib/studio";

export async function loadTemplate(id: string): Promise<Template | null> {
  const { data } = await supabase.from("templates").select("*").eq("id", id).maybeSingle();
  return (data as unknown as Template) ?? null;
}

// Save an AI-generated draft as a regular lesson template ("قوالبي").
export async function saveTemplate(t: Omit<Template, "id">): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from("templates")
    .insert({ name: t.name, category: t.category, width: t.width, height: t.height, background: t.background, elements: t.elements as never, display_mode: t.display_mode ?? "boxed", is_system: false })
    .select("id")
    .single();
  return { id: data?.id ?? null, error: error?.message ?? null };
}
