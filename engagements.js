import { db, storage } from 'hatchable';
import { textValue, bad, audit } from 'lib/core.js';
export const access = 'user';
export const methods = ['GET','PUT'];
export default async function (req, res) {
  try {
    const user = req.user;
    if (!user) return bad(res, 401, 'Please sign in to continue.');
    if (req.method === 'GET') {
      const id = Number(req.query && req.query.id);
      if (Number.isSafeInteger(id) && id > 0) {
        const found = await db.query('SELECT e.*,b.objective,b.details,b.content_type,b.formats,b.commercial_use,b.licensing_requirements,br.display_name AS brand_name,cr.display_name AS creator_name FROM engagements e JOIN briefs b ON b.id=e.brief_id LEFT JOIN app_profiles br ON br.user_id=e.brand_user_id LEFT JOIN app_profiles cr ON cr.user_id=e.creator_user_id WHERE e.id=$1 AND (e.brand_user_id=$2 OR e.creator_user_id=$2) LIMIT 1', [id,String(user.id)]);
        if (!found.rows[0]) return bad(res, 404, 'Engagement not found.');
        const deliverables = await db.query('SELECT * FROM deliverables WHERE engagement_id=$1 ORDER BY version DESC', [id]);
        const signedDeliverables = await Promise.all(deliverables.rows.map(async d => ({ ...d, file_url: d.file_key ? await storage.url(d.file_key) : d.file_url })));
        return res.json({ engagement: found.rows[0], deliverables: signedDeliverables });
      }
      const list = await db.query('SELECT e.*,b.title AS brief_title,b.deadline,br.display_name AS brand_name,cr.display_name AS creator_name FROM engagements e JOIN briefs b ON b.id=e.brief_id LEFT JOIN app_profiles br ON br.user_id=e.brand_user_id LEFT JOIN app_profiles cr ON cr.user_id=e.creator_user_id WHERE e.brand_user_id=$1 OR e.creator_user_id=$1 ORDER BY e.updated_at DESC LIMIT 100', [String(user.id)]);
      return res.json({ engagements: list.rows });
    }
    const b = req.body || {};
    const id = Number(b.id);
    const found = await db.query('SELECT * FROM engagements WHERE id=$1 AND (brand_user_id=$2 OR creator_user_id=$2) LIMIT 1', [id,String(user.id)]);
    const e = found.rows[0];
    if (!e) return bad(res, 404, 'Engagement not found.');
    const profile = await db.query('SELECT role FROM app_profiles WHERE user_id=$1 LIMIT 1', [String(user.id)]);
    const role = profile.rows[0] && profile.rows[0].role;
    const action = textValue(b.action,40);
    if (action === 'cancel' && role === 'brand' && String(e.brand_user_id) === String(user.id) && ['active','revision_requested'].includes(e.status)) {
      const updated = await db.query("UPDATE engagements SET status='cancelled',updated_at=now() WHERE id=$1 RETURNING *", [id]);
      await audit(db,user.id,'engagement',id,'engagement_cancelled');
      return res.json({ engagement: updated.rows[0] });
    }
    if (action === 'milestones' && ['brand','creator'].includes(role) && ['active','in_review','revision_requested'].includes(e.status)) {
      if (Array.isArray(b.milestones)) {
        const safe = b.milestones.slice(0,12).map((m,i) => ({
          title: textValue(m && m.title,120) || ('Milestone ' + (i+1)),
          days: Math.max(0,Math.min(365,Number(m && m.days)||0)),
          status: ['pending','in_progress','complete'].includes(m && m.status) ? m.status : 'pending'
        }));
        const updated = await db.query('UPDATE engagements SET milestones=$1::jsonb,updated_at=now() WHERE id=$2 RETURNING *', [JSON.stringify(safe),id]);
        await audit(db,user.id,'engagement',id,'milestones_updated',{ count:safe.length });
        return res.json({ engagement: updated.rows[0] });
      }
    }
    return bad(res, 400, 'That engagement change is not allowed.');
  } catch (e) { console.error('engagement_api_error', e && e.message); return bad(res, 500, 'Engagement request failed.'); }
}