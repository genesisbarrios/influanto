import supabase from "@/libs/supabase";

const norm = (s?: unknown) => String(s ?? "").trim().toLowerCase();
const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
const isPhone = (s: string) => !s.includes("@") && s.replace(/\D/g, "").length >= 7;

const FIELDS = ["name", "email", "phone", "role", "publisher", "publishing_percent"] as const;
type Fields = Partial<Record<(typeof FIELDS)[number], string>>;

// Save a split sheet's people into the owner's collaborator contacts, whether or
// not the sheet has been signed. Contributors are matched to an existing contact
// by email first, then by name; any changed detail (name, email, phone, role,
// publisher, publishing %) is written back. New contributors with an email
// become contacts. Publishing rows for people not listed as contributors only
// update an existing contact with that name.
export async function syncCollaboratorContacts(userId: string, contributors: any[] = [], publishing: any[] = []) {
  const { data: existing, error } = await supabase
    .from("collaborator_contacts")
    .select("id, name, email, phone, role, publisher, publishing_percent")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);

  const contacts = existing ?? [];
  const byEmail = new Map(contacts.filter((c: any) => c.email).map((c: any) => [norm(c.email), c]));
  const byName = new Map(contacts.map((c: any) => [norm(c.name), c]));
  const pubs = (publishing ?? []).filter((p: any) => String(p?.contributorName ?? "").trim());
  const pubFor = (name: string) => pubs.find((p: any) => norm(p.contributorName) === norm(name));

  const updates = new Map<string, Fields>();
  const inserts = new Map<string, Fields>();

  const queueUpdate = (ct: any, fields: Fields) => {
    const patch: Fields = { ...(updates.get(ct.id) ?? {}) };
    for (const k of FIELDS) {
      const v = String(fields[k] ?? "").trim();
      if (!v) continue; // a blank cell never wipes a saved value
      const value = k === "email" ? v.toLowerCase() : v;
      if (value !== String(ct[k] ?? "")) patch[k] = value;
    }
    // Don't move an email onto this contact if another contact already owns it
    if (patch.email && byEmail.has(patch.email) && byEmail.get(patch.email).id !== ct.id) delete patch.email;
    if (Object.keys(patch).length) updates.set(ct.id, patch);
  };

  const touched = new Set<string>();
  for (const c of contributors ?? []) {
    const name = String(c?.name ?? "").trim();
    if (!name) continue;
    const contact = String(c?.contact ?? "").trim();
    const email = isEmail(contact) ? contact.toLowerCase() : "";
    const phone = isPhone(contact) ? contact : "";
    const pub = pubFor(name);
    const fields: Fields = { name, email, phone, role: c?.role, publisher: pub?.publisher, publishing_percent: pub?.percent };

    const match = (email && byEmail.get(email)) || byName.get(norm(name));
    if (match) {
      touched.add(match.id);
      queueUpdate(match, fields);
    } else if (email && !inserts.has(email)) {
      inserts.set(email, fields);
    }
  }

  for (const p of pubs) {
    const match = byName.get(norm(p.contributorName));
    if (!match || touched.has(match.id)) continue;
    touched.add(match.id);
    queueUpdate(match, { publisher: p.publisher, publishing_percent: p.percent });
  }

  const ops: PromiseLike<{ error: any }>[] = [];
  updates.forEach((patch, id) => {
    ops.push(supabase.from("collaborator_contacts").update(patch).eq("id", id).eq("user_id", userId));
  });
  if (inserts.size) {
    ops.push(supabase.from("collaborator_contacts").insert(
      Array.from(inserts.values()).map((f) => ({
        user_id: userId,
        name: f.name ?? "",
        email: f.email ?? "",
        phone: f.phone ?? "",
        role: String(f.role ?? "").trim(),
        publisher: String(f.publisher ?? "").trim(),
        publishing_percent: String(f.publishing_percent ?? "").trim(),
      }))
    ));
  }
  const results = await Promise.all(ops);
  const failed = results.find((r) => r.error);
  if (failed) throw new Error(failed.error.message);
  return { updated: updates.size, added: inserts.size };
}
