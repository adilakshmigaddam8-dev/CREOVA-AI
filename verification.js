import { db, auth } from 'hatchable';
import { textValue, bad, audit } from 'lib/core.js';
// Resolve the app session inside the handler so browser requests receive a
// normal JSON 401 instead of being intercepted by the route-level auth gate.
export const access = 'public';
export const methods = ['GET','POST','PUT'];
async function roleFor(userId) {
  const r = await db.query('SELECT role FROM app_profiles WHERE user_id=$1 LIMIT 1', [String(userId)]);
  return r.rows[0] && r.rows[0].role;
}
export default async function (req, res) {
  try {
    const user = req.user || await auth.getUser(req);
    if (!user) return bad(res, 401, 'Please sign in to continue.');
    const role = await roleFor(user.id);
    if (req.method === 'GET') {
      if (req.query && req.query.review === 'true') {
        if (role !== 'admin') return bad(res, 403, 'Verification review is restricted to administrators.');
        const pending = await db.query("SELECT v.*,p.display_name AS creator_name,pi.title AS portfolio_title FROM verification_records v LEFT JOIN app_profiles p ON p.user_id=v.creator_user_id LEFT JOIN portfolio_items pi ON pi.id=v.portfolio_item_id WHERE v.status='evidence_submitted' ORDER BY v.created_at ASC LIMIT 150");
        return res.json({ records: pending.rows, view: 'review' });
      }
      if (role === 'admin') {
        const all = await db.query('SELECT v.*,p.display_name AS creator_name FROM verification_records v LEFT JOIN app_profiles p ON p.user_id=v.creator_user_id ORDER BY v.created_at DESC LIMIT 200');
        return res.json({ records: all.rows, view: 'all' });
      }
      const own = await db.query('SELECT * FROM verification_records WHERE creator_user_id=$1 ORDER BY created_at DESC LIMIT 100', [String(user.id)]);
      return res.json({ records: own.rows, view: 'mine' });
    }
    const b = req.body || {};
    if (req.method === 'POST') {
      if (role !== 'creator') return bad(res, 403, 'Only creators can submit claims for review.');
      const claimType = ['tool','workflow','past_work'].includes(b.claim_type) ? b.claim_type : '';
      const claim = textValue(b.claim,500);
      const evidenceUrl = /^https?:\/\/\S+$/i.test(textValue(b.evidence_url,1000)) ? textValue(b.evidence_url,1000) : '';
      const evidenceNotes = textValue(b.evidence_notes,1500);
      const portfolioId = b.portfolio_item_id ? Number(b.portfolio_item_id) : null;
      if (!claimType || !claim) return bad(res, 400, 'Choose a claim type and describe the claim.');
      if (portfolioId) {
        const owned = await db.query('SELECT id FROM portfolio_items WHERE id=$1 AND creator_user_id=$2 LIMIT 1', [portfolioId,String(user.id)]);
        if (!owned.rows[0]) return bad(res, 404, 'That portfolio item is not yours.');
      }
      const status = evidenceUrl || evidenceNotes ? 'evidence_submitted' : 'self_reported';
      const saved = await db.query('INSERT INTO verification_records (creator_user_id,portfolio_item_id,claim_type,claim,evidence_url,evidence_notes,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [String(user.id),portfolioId,claimType,claim,evidenceUrl,evidenceNotes,status]);
      await audit(db,user.id,'verification',saved.rows[0].id,'verification_submitted',{ status,claim_type:claimType });
      return res.json({ record:saved.rows[0] });
    }
    if (role !== 'admin') return bad(res, 403, 'Only administrators can review evidence.');
    const id = Number(b.id);
    const decision = textValue(b.action,30);
    if (!Number.isSafeInteger(id) || id < 1 || !['verify','reject'].includes(decision)) return bad(res, 400, 'Choose a record and approve or reject it.');
    const updated = await db.query("UPDATE verification_records SET status=$1,reviewer_user_id=$2,review_notes=$3,reviewed_at=now(),updated_at=now() WHERE id=$4 AND status='evidence_submitted' RETURNING *", [decision === 'verify' ? 'verified' : 'rejected',String(user.id),textValue(b.review_notes,1500),id]);
    if (!updated.rows[0]) return bad(res, 404, 'Pending verification record not found.');
    await audit(db,user.id,'verification',id,decision === 'verify' ? 'claim_verified' : 'claim_rejected');
    return res.json({ record:updated.rows[0] });
  } catch (e) { console.error('verification_api_error', e && e.message); return bad(res, 500, 'Verification request failed.'); }
}