import { db } from 'hatchable';
import { textValue, bad } from 'lib/core.js';
export const access = 'user';
export const methods = ['GET','POST','DELETE'];
export default async function (req, res) {
  try {
    const user = req.user;
    if (!user) return bad(res, 401, 'Please sign in to manage a shortlist.');
    const profile = await db.query('SELECT role FROM app_profiles WHERE user_id=$1 LIMIT 1', [String(user.id)]);
    if (!profile.rows[0] || profile.rows[0].role !== 'brand') return bad(res, 403, 'Only brands and agencies can save creators.');
    if (req.method === 'GET') {
      const found = await db.query('SELECT s.id,s.creator_user_id,s.created_at,p.display_name,p.headline,p.location,p.avatar_url,p.skills,p.tools,p.categories,p.formats,p.price_min,p.price_max,p.currency FROM shortlists s JOIN app_profiles p ON p.user_id=s.creator_user_id WHERE s.brand_user_id=$1 ORDER BY s.created_at DESC', [String(user.id)]);
      return res.json({ creators:found.rows });
    }
    const creatorId = textValue((req.body && req.body.creator_user_id) || (req.query && req.query.creator_user_id),200);
    if (!creatorId) return bad(res, 400, 'A creator is required.');
    if (req.method === 'POST') {
      const eligible = await db.query("SELECT user_id FROM app_profiles WHERE user_id=$1 AND role='creator' AND public_profile=true LIMIT 1", [creatorId]);
      if (!eligible.rows[0]) return bad(res, 404, 'Public creator not found.');
      const saved = await db.query('INSERT INTO shortlists (brand_user_id,creator_user_id) VALUES ($1,$2) ON CONFLICT (brand_user_id,creator_user_id) DO NOTHING RETURNING id,creator_user_id', [String(user.id),creatorId]);
      return res.json({ ok:true, saved:saved.rows[0] || { creator_user_id:creatorId } });
    }
    const removed = await db.query('DELETE FROM shortlists WHERE brand_user_id=$1 AND creator_user_id=$2 RETURNING creator_user_id', [String(user.id),creatorId]);
    return res.json({ ok:true, removed:!!removed.rows[0] });
  } catch (e) { console.error('shortlist_api_error', e && e.message); return bad(res, 500, 'Shortlist request failed.'); }
}