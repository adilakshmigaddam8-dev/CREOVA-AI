export function textValue(value, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
export function listValue(value, maxItems = 30) {
  if (Array.isArray(value)) return value.map(v => textValue(String(v), 100)).filter(Boolean).slice(0, maxItems);
  if (typeof value === 'string') return value.split(',').map(v => v.trim()).filter(Boolean).slice(0, maxItems).map(v => v.slice(0, 100));
  return [];
}
export function numberValue(value, fallback = 0, max = 100000000) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : fallback;
}
export function boolValue(value) { return value === true || value === 'true' || value === 1; }
export function bad(res, status, error, details) { return res.status(status).json({ error, ...(details ? { details } : {}) }); }
export async function audit(db, actor, type, id, action, details = {}) {
  await db.query('INSERT INTO audit_events (actor_user_id, entity_type, entity_id, action, details) VALUES ($1,$2,$3,$4,$5::jsonb)', [String(actor), type, String(id), action, JSON.stringify(details)]);
}
export function isIsoDate(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + 'T00:00:00Z')); }
export function makeMatchScore(profile, brief) {
  const norm = xs => (Array.isArray(xs) ? xs : []).map(x => String(x).toLowerCase());
  const skillSet = norm(profile.skills), toolSet = norm(profile.tools), cats = norm(profile.categories), formats = norm(profile.formats);
  const hits = (wanted, available) => { const w = norm(wanted); return w.length ? w.filter(x => available.some(a => a.includes(x) || x.includes(a))).length / w.length : 0.5; };
  const checks = [
    ['Skills', hits(brief.required_skills, skillSet), 0.26],
    ['Tools', hits(brief.required_tools, toolSet), 0.18],
    ['Content type', hits([brief.content_type], cats), 0.18],
    ['Formats', hits(brief.formats, formats), 0.10],
    ['Budget', !brief.budget_max || (!profile.price_min || Number(profile.price_min) <= Number(brief.budget_max)) ? 1 : 0, 0.12],
    ['Availability', profile.availability === 'open' ? 1 : 0.35, 0.08],
    ['Commercial use', !brief.commercial_use || profile.commercial_use_declared === true ? 1 : 0, 0.08]
  ];
  const score = Math.round(checks.reduce((sum, c) => sum + c[1] * c[2], 0) * 100);
  return { score, reasons: checks.filter(c => c[1] >= 0.7).map(c => c[0] + ' fit'), caution: brief.commercial_use ? 'Confirm commercial-use rights directly with the creator.' : '' };
}