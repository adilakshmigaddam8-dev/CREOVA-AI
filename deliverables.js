import { db, storage } from 'hatchable';
import { textValue, bad, audit } from 'lib/core.js';
export const access = 'user';
export const methods = ['GET','POST','PUT'];
export default async function (req, res) {
  try {
    const user = req.user;
    if (!user) return bad(res, 401, 'Please sign in to continue.');
    if (req.method === 'GET') {
      const engagementId = Number(req.query && req.query.engagement_id);
      const engagement = await db.query('SELECT id FROM engagements WHERE id=$1 AND (brand_user_id=$2 OR creator_user_id=$2) LIMIT 1', [engagementId,String(user.id)]);
      if (!engagement.rows[0]) return bad(res, 404, 'Engagement not found.');
      const found = await db.query('SELECT * FROM deliverables WHERE engagement_id=$1 ORDER BY version DESC', [engagementId]);
      const items = await Promise.all(found.rows.map(async d => ({ ...d, file_url: d.file_key ? await storage.url(d.file_key) : d.file_url })));
      return res.json({ deliverables: items });
    }
    const b = req.body || {};
    const engagementId = Number(b.engagement_id);
    const found = await db.query('SELECT * FROM engagements WHERE id=$1 AND (brand_user_id=$2 OR creator_user_id=$2) LIMIT 1', [engagementId,String(user.id)]);
    const e = found.rows[0];
    if (!e) return bad(res, 404, 'Engagement not found.');
    const profile = await db.query('SELECT role FROM app_profiles WHERE user_id=$1 LIMIT 1', [String(user.id)]);
    const role = profile.rows[0] && profile.rows[0].role;
    if (req.method === 'POST') {
      if (role !== 'creator' || String(e.creator_user_id) !== String(user.id)) return bad(res, 403, 'Only the assigned creator can submit deliverables.');
      if (!['active','revision_requested','in_review'].includes(e.status)) return bad(res, 400, 'This engagement is not accepting submissions.');
      const title = textValue(b.title,160);
      const fileKey = typeof b.file_key === 'string' && b.file_key.startsWith('uploads/' + String(user.id) + '/') ? b.file_key.slice(0,500) : '';
      const fileUrl = /^https?:\/\/\S+$/i.test(textValue(b.file_url,1000)) ? textValue(b.file_url,1000) : '';
      if (!title || (!fileKey && !fileUrl)) return bad(res, 400, 'Add a title and upload a file or provide a deliverable URL.');
      const versionResult = await db.query('SELECT COALESCE(MAX(version),0)::int AS last_version FROM deliverables WHERE engagement_id=$1', [engagementId]);
      const version = (versionResult.rows[0] ? versionResult.rows[0].last_version : 0) + 1;
      const saved = await db.query("INSERT INTO deliverables (engagement_id,creator_user_id,version,title,notes,file_url,file_key,status) VALUES ($1,$2,$3,$4,$5,$6,$7,'submitted') RETURNING *", [engagementId,String(user.id),version,title,textValue(b.notes,1500),fileUrl,fileKey]);
      const up = await db.query("UPDATE engagements SET status='in_review',updated_at=now() WHERE id=$1 RETURNING *", [engagementId]);
      await audit(db,user.id,'deliverable',saved.rows[0].id,'deliverable_submitted',{ engagement_id:engagementId,version });
      return res.json({ deliverable: { ...saved.rows[0], file_url: fileKey ? await storage.url(fileKey) : fileUrl }, engagement: up.rows[0] });
    }
    const deliverableId = Number(b.id);
    const action = textValue(b.action,40);
    if (role !== 'brand' || String(e.brand_user_id) !== String(user.id)) return bad(res, 403, 'Only the hiring brand can review deliverables.');
    if (!['approve','request_revision'].includes(action)) return bad(res, 400, 'Choose approve or request revision.');
    const feedback = textValue(b.feedback,2000);
    if (action === 'request_revision' && !feedback) return bad(res, 400, 'Add feedback describing the requested changes.');
    const d = await db.query('UPDATE deliverables SET status=$1,brand_feedback=$2 WHERE id=$3 AND engagement_id=$4 RETURNING *', [action === 'approve' ? 'approved' : 'revision_requested',feedback,deliverableId,engagementId]);
    if (!d.rows[0]) return bad(res, 404, 'Deliverable not found.');
    const state = action === 'approve' ? 'approved' : 'revision_requested';
    const up = await db.query('UPDATE engagements SET status=$1,updated_at=now() WHERE id=$2 RETURNING *', [state,engagementId]);
    await audit(db,user.id,'deliverable',deliverableId,action === 'approve' ? 'deliverable_approved' : 'revision_requested',{ engagement_id:engagementId });
    return res.json({ deliverable:d.rows[0], engagement:up.rows[0] });
  } catch (e) { console.error('deliverable_api_error', e && e.message); return bad(res, 500, 'Deliverable request failed.'); }
}