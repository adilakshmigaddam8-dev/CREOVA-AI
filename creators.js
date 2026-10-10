import { db } from 'hatchable';
import { textValue, numberValue, bad } from 'lib/core.js';
export const access = 'public';
export const methods = ['GET'];
export default async function (req, res) {
  try {
    const query = req.query || {};
    const q = textValue(query.q, 120).toLowerCase();
    const tool = textValue(query.tool, 80).toLowerCase();
    const category = textValue(query.category, 80).toLowerCase();
    const skill = textValue(query.skill, 80).toLowerCase();
    const format = textValue(query.format, 80).toLowerCase();
    const availability = textValue(query.availability, 30);
    const minPrice = query.minPrice !== undefined ? numberValue(query.minPrice, 0) : null;
    const maxPrice = query.maxPrice !== undefined ? numberValue(query.maxPrice, 100000000) : null;
    const sort = ['price_low','price_high','name'].includes(query.sort) ? query.sort : 'relevance';
    const page = Math.max(1, Math.floor(numberValue(query.page, 1, 10000)));
    const limit = Math.min(24, Math.max(1, Math.floor(numberValue(query.limit, 12, 24))));
    const where = ["p.role='creator'", 'p.public_profile=true', "lower(p.display_name) NOT LIKE '%smoke test%'", "lower(p.headline) NOT LIKE '%temporary profile for automated workflow checks%'"];
    const params = [];
    if (q) {
      params.push(q);
      const n = params.length;
      where.push("(lower(p.display_name) LIKE '%' || $" + n + " || '%' OR lower(p.headline) LIKE '%' || $" + n + " || '%' OR lower(p.bio) LIKE '%' || $" + n + " || '%' OR lower(p.location) LIKE '%' || $" + n + " || '%' OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(p.skills) AS s(value) WHERE lower(s.value) LIKE '%' || $" + n + " || '%') OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(p.tools) AS t(value) WHERE lower(t.value) LIKE '%' || $" + n + " || '%') OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(p.categories) AS c(value) WHERE lower(c.value) LIKE '%' || $" + n + " || '%'))");
    }
    if (tool) { params.push('%' + tool + '%'); where.push('EXISTS (SELECT 1 FROM jsonb_array_elements_text(p.tools) AS t(value) WHERE lower(t.value) LIKE $' + params.length + ')'); }
    if (category) { params.push('%' + category + '%'); const n=params.length; where.push('(EXISTS (SELECT 1 FROM jsonb_array_elements_text(p.categories) AS c(value) WHERE lower(c.value) LIKE $' + n + ') OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(p.skills) AS s(value) WHERE lower(s.value) LIKE $' + n + '))'); }
    if (skill) { params.push('%' + skill + '%'); where.push('EXISTS (SELECT 1 FROM jsonb_array_elements_text(p.skills) AS s(value) WHERE lower(s.value) LIKE $' + params.length + ')'); }
    if (format) { params.push('%' + format + '%'); const n=params.length; where.push('(EXISTS (SELECT 1 FROM jsonb_array_elements_text(p.formats) AS f(value) WHERE lower(f.value) LIKE $' + n + ') OR EXISTS (SELECT 1 FROM portfolio_items pi, LATERAL jsonb_array_elements_text(pi.formats) AS pf(value) WHERE pi.creator_user_id=p.user_id AND pi.visibility=\'public\' AND lower(pf.value) LIKE $' + n + '))'); }
    if (availability && ['open','limited','unavailable'].includes(availability)) { params.push(availability); where.push('p.availability=$' + params.length); }
    if (minPrice !== null) { params.push(minPrice); where.push('p.price_max >= $' + params.length); }
    if (maxPrice !== null) { params.push(maxPrice); where.push('(p.price_min <= $' + params.length + ' OR p.price_min = 0)'); }
    const order = sort === 'price_low' ? 'p.price_min ASC, p.display_name ASC' : sort === 'price_high' ? 'p.price_max DESC, p.display_name ASC' : sort === 'name' ? 'p.display_name ASC' : q ? "CASE WHEN lower(p.display_name) = $1 THEN 0 WHEN lower(p.display_name) LIKE '%' || $1 || '%' THEN 1 WHEN lower(p.headline) LIKE '%' || $1 || '%' THEN 2 ELSE 3 END, p.updated_at DESC, p.display_name ASC" : 'p.updated_at DESC, p.display_name ASC';
    const count = await db.query('SELECT COUNT(*)::int AS total FROM app_profiles p WHERE ' + where.join(' AND '), params);
    const offset = (page-1)*limit;
    params.push(limit, offset);
    const sql = "SELECT p.user_id,p.display_name,p.headline,p.bio,p.location,p.avatar_url,p.skills,p.tools,CASE WHEN p.categories='[]'::jsonb THEN COALESCE((SELECT jsonb_agg(DISTINCT s.value) FROM jsonb_array_elements_text(p.skills) AS s(value) WHERE lower(s.value) IN ('ui/ux design','web design','graphic design','brand identity','ai filmmaking','animation','advertising','motion graphics','image generation','art direction','digital content design')), '[]'::jsonb) ELSE p.categories END AS categories,CASE WHEN p.formats='[]'::jsonb THEN COALESCE((SELECT jsonb_agg(DISTINCT f.value) FROM portfolio_items pi,LATERAL jsonb_array_elements_text(pi.formats) AS f(value) WHERE pi.creator_user_id=p.user_id AND pi.visibility='public'), '[]'::jsonb) ELSE p.formats END AS formats,p.languages,p.availability,p.price_min,p.price_max,p.currency,p.website,(SELECT COUNT(*)::int FROM portfolio_items pi WHERE pi.creator_user_id=p.user_id AND pi.visibility='public') AS portfolio_count FROM app_profiles p WHERE " + where.join(' AND ') + ' ORDER BY ' + order + ' LIMIT $' + (params.length-1) + ' OFFSET $' + params.length;
    const result = await db.query(sql, params);
    const total = (count.rows[0] && count.rows[0].total) || 0;
    return res.json({ creators: result.rows, total, page, limit, pages: Math.ceil(total/limit) });
  } catch (e) { console.error('creator_search_error', e && e.message); return bad(res, 500, 'Creator search failed. Please try again.'); }
}