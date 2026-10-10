import { db, auth } from 'hatchable';
import { textValue, listValue, numberValue, boolValue, bad, isIsoDate } from 'lib/core.js';
export const access = 'public';
export const methods = ['GET','POST','PUT','DELETE'];
const JSON_FIELDS = ['reference_urls','required_skills','required_tools','deliverables','formats','aspect_ratios','channels'];
function serializeArray(b, key) { return JSON.stringify(listValue(b[key], 40)); }
function validPublish(b) {
  if (!textValue(b.title, 160) || !textValue(b.objective, 1500) || !textValue(b.details, 5000) || !textValue(b.content_type, 100)) return 'Add a title, objective, detailed requirements, and content type before publishing.';
  if (b.commercial_use === undefined || b.commercial_use === null) return 'Confirm whether commercial use is required before publishing.';
  if (numberValue(b.budget_max) < numberValue(b.budget_min)) return 'Maximum budget must be at least the minimum budget.';
  if (b.deadline && !isIsoDate(b.deadline)) return 'Use a valid deadline date.';
  if (b.deadline && Date.parse(b.deadline + 'T23:59:59Z') < Date.now()) return 'The deadline must be in the future.';
  return '';
}
export default async function (req, res) {
  try {
    const user = req.user || await auth.getUser(req);
    const query = req.query || {};
    if (req.method === 'GET') {
      if (query.mine === 'true') {
        if (!user) return bad(res, 401, 'Sign in to view your briefs.');
        const mine = await db.query('SELECT * FROM briefs WHERE brand_user_id=$1 ORDER BY updated_at DESC LIMIT 100', [String(user.id)]);
        return res.json({ briefs: mine.rows });
      }
      const q = textValue(query.q, 120).toLowerCase();
      const params = [];
      let where = "status='published'";
      if (q) { params.push('%' + q + '%'); where += ' AND (lower(title) LIKE $1 OR lower(objective) LIKE $1 OR lower(content_type) LIKE $1)'; }
      const found = await db.query('SELECT b.*,p.display_name AS brand_name,p.organization,p.avatar_url FROM briefs b LEFT JOIN app_profiles p ON p.user_id=b.brand_user_id WHERE ' + where + ' ORDER BY b.created_at DESC LIMIT 60', params);
      return res.json({ briefs: found.rows });
    }
    if (!user) return bad(res, 401, 'Please sign in to continue.');
    const profile = await db.query('SELECT role FROM app_profiles WHERE user_id=$1 LIMIT 1', [String(user.id)]);
    if (!profile.rows[0] || profile.rows[0].role !== 'brand') return bad(res, 403, 'Only Brand / Agency accounts can manage briefs.');
    const b = req.body || {};
    const id = Number(b.id);
    if (req.method === 'DELETE') {
      if (!Number.isSafeInteger(id) || id < 1) return bad(res, 400, 'A valid brief is required.');
      const del = await db.query('DELETE FROM briefs WHERE id=$1 AND brand_user_id=$2 RETURNING id', [id, String(user.id)]);
      if (!del.rows[0]) return bad(res, 404, 'Brief not found.');
      return res.json({ ok: true });
    }
    const status = ['draft','published','closed','archived'].includes(b.status) ? b.status : 'draft';
    if (status === 'published') { const err = validPublish(b); if (err) return bad(res, 400, err); }
    const title = textValue(b.title, 160);
    if (!title) return bad(res, 400, 'Campaign title is required even for a draft.');
    const min = numberValue(b.budget_min), max = numberValue(b.budget_max);
    if (max && min > max) return bad(res, 400, 'Maximum budget must be at least the minimum budget.');
    const vals = [
      String(user.id), title, textValue(b.objective, 1500), textValue(b.details, 5000), textValue(b.content_type, 100),
      textValue(b.visual_style, 500), serializeArray(b,'reference_urls'), serializeArray(b,'required_skills'), serializeArray(b,'required_tools'),
      serializeArray(b,'deliverables'), serializeArray(b,'formats'), serializeArray(b,'aspect_ratios'), textValue(b.duration, 100),
      textValue(b.resolution, 100), min, max, textValue(b.currency, 8).toUpperCase() || 'USD',
      b.deadline && isIsoDate(b.deadline) ? b.deadline : null, boolValue(b.commercial_use), serializeArray(b,'channels'),
      textValue(b.territories, 400), textValue(b.usage_duration, 120), textValue(b.exclusivity, 300),
      textValue(b.licensing_requirements, 1200), textValue(b.extra_instructions, 2000), status
    ];
    if (req.method === 'POST') {
      const sql = 'INSERT INTO briefs (brand_user_id,title,objective,details,content_type,visual_style,reference_urls,required_skills,required_tools,deliverables,formats,aspect_ratios,duration,resolution,budget_min,budget_max,currency,deadline,commercial_use,channels,territories,usage_duration,exclusivity,licensing_requirements,extra_instructions,status) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb,$13,$14,$15,$16,$17,$18,$19,$20::jsonb,$21,$22,$23,$24,$25,$26) RETURNING *';
      const saved = await db.query(sql, vals);
      return res.json({ brief: saved.rows[0] });
    }
    if (!Number.isSafeInteger(id) || id < 1) return bad(res, 400, 'A valid brief is required.');
    const updateVals = vals.slice(1); updateVals.push(id,String(user.id));
    const sql = 'UPDATE briefs SET title=$1,objective=$2,details=$3,content_type=$4,visual_style=$5,reference_urls=$6::jsonb,required_skills=$7::jsonb,required_tools=$8::jsonb,deliverables=$9::jsonb,formats=$10::jsonb,aspect_ratios=$11::jsonb,duration=$12,resolution=$13,budget_min=$14,budget_max=$15,currency=$16,deadline=$17,commercial_use=$18,channels=$19::jsonb,territories=$20,usage_duration=$21,exclusivity=$22,licensing_requirements=$23,extra_instructions=$24,status=$25,updated_at=now() WHERE id=$26 AND brand_user_id=$27 RETURNING *';
    const saved = await db.query(sql, updateVals);
    if (!saved.rows[0]) return bad(res, 404, 'Brief not found.');
    return res.json({ brief: saved.rows[0] });
  } catch (e) { console.error('brief_api_error', e && e.message); return bad(res, 500, 'Brief request failed.'); }
}