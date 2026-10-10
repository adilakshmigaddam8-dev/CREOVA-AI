import { db } from 'hatchable';
import { textValue, numberValue, bad, audit } from 'lib/core.js';
export const access = 'user';
export const methods = ['GET','POST','PUT'];
function milestones(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0,12).map((m,i) => {
    if (typeof m === 'string') return { title: textValue(m,120), days: 0, status: 'pending' };
    return { title: textValue(m && m.title,120) || ('Milestone ' + (i+1)), days: Math.floor(numberValue(m && m.days,0,365)), status: 'pending' };
  }).filter(m => m.title);
}
export default async function (req, res) {
  try {
    const user = req.user;
    if (!user) return bad(res, 401, 'Please sign in to continue.');
    const prof = await db.query('SELECT role FROM app_profiles WHERE user_id=$1 LIMIT 1', [String(user.id)]);
    const role = prof.rows[0] && prof.rows[0].role;
    if (req.method === 'GET') {
      if (role === 'creator') {
        const r = await db.query('SELECT p.*,b.title AS brief_title,b.deadline,b.currency AS brief_currency,b.brand_user_id,br.organization AS brand_name FROM proposals p JOIN briefs b ON b.id=p.brief_id LEFT JOIN app_profiles br ON br.user_id=b.brand_user_id WHERE p.creator_user_id=$1 ORDER BY p.created_at DESC LIMIT 100', [String(user.id)]);
        return res.json({ proposals: r.rows });
      }
      if (role === 'brand') {
        const r = await db.query('SELECT p.*,b.title AS brief_title,b.deadline,b.brand_user_id,cr.display_name AS creator_name,cr.headline AS creator_headline FROM proposals p JOIN briefs b ON b.id=p.brief_id LEFT JOIN app_profiles cr ON cr.user_id=p.creator_user_id WHERE b.brand_user_id=$1 ORDER BY p.created_at DESC LIMIT 150', [String(user.id)]);
        return res.json({ proposals: r.rows });
      }
      return bad(res, 403, 'This account cannot manage proposals.');
    }
    const b = req.body || {};
    const id = Number(b.id);
    if (req.method === 'POST') {
      if (role !== 'creator') return bad(res, 403, 'Only creators can apply to briefs.');
      const briefId = Number(b.brief_id);
      if (!Number.isSafeInteger(briefId) || briefId < 1) return bad(res, 400, 'Choose a published brief.');
      const briefResult = await db.query("SELECT id,title,status,deadline,budget_min,budget_max,currency FROM briefs WHERE id=$1 AND status='published' LIMIT 1", [briefId]);
      const brief = briefResult.rows[0];
      if (!brief) return bad(res, 404, 'That brief is no longer accepting proposals.');
      if (brief.deadline && Date.parse(String(brief.deadline).slice(0,10) + 'T23:59:59Z') < Date.now()) return bad(res, 400, 'The brief deadline has passed.');
      const duplicate = await db.query("SELECT id FROM proposals WHERE brief_id=$1 AND creator_user_id=$2 AND status IN ('submitted','accepted') LIMIT 1", [briefId,String(user.id)]);
      if (duplicate.rows[0]) return bad(res, 409, 'You already have an active proposal for this brief.');
      const cover = textValue(b.cover_letter,3000);
      const price = numberValue(b.proposed_price, -1);
      const days = Math.floor(numberValue(b.delivery_days,0,365));
      if (!cover || price <= 0 || days < 1) return bad(res, 400, 'Add a cover letter, a positive price, and delivery days.');
      const saved = await db.query("INSERT INTO proposals (brief_id,creator_user_id,cover_letter,proposed_price,currency,delivery_days,milestones) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb) RETURNING *", [briefId,String(user.id),cover,price,textValue(b.currency,8).toUpperCase() || brief.currency || 'USD',days,JSON.stringify(milestones(b.milestones))]);
      await audit(db, user.id, 'proposal', saved.rows[0].id, 'proposal_submitted', { brief_id: briefId });
      return res.json({ proposal: saved.rows[0] });
    }
    if (!Number.isSafeInteger(id) || id < 1) return bad(res, 400, 'A valid proposal is required.');
    const found = await db.query('SELECT p.*,b.brand_user_id,b.title AS brief_title,b.deadline FROM proposals p JOIN briefs b ON b.id=p.brief_id WHERE p.id=$1 LIMIT 1', [id]);
    const proposal = found.rows[0];
    if (!proposal) return bad(res, 404, 'Proposal not found.');
    const action = textValue(b.action,30);
    if (role === 'creator' && String(proposal.creator_user_id) === String(user.id) && action === 'withdraw' && proposal.status === 'submitted') {
      const updated = await db.query("UPDATE proposals SET status='withdrawn',updated_at=now() WHERE id=$1 AND status='submitted' RETURNING *", [id]);
      await audit(db, user.id, 'proposal', id, 'proposal_withdrawn');
      return res.json({ proposal: updated.rows[0] });
    }
    if (role !== 'brand' || String(proposal.brand_user_id) !== String(user.id)) return bad(res, 403, 'You cannot change this proposal.');
    if (!['accept','decline'].includes(action) || proposal.status !== 'submitted') return bad(res, 400, 'This proposal is not in a state that can be changed.');
    if (action === 'decline') {
      const updated = await db.query("UPDATE proposals SET status='declined',updated_at=now() WHERE id=$1 AND status='submitted' RETURNING *", [id]);
      if (!updated.rows[0]) return bad(res, 409, 'The proposal status changed. Refresh and try again.');
      await audit(db, user.id, 'proposal', id, 'proposal_declined');
      return res.json({ proposal: updated.rows[0] });
    }
    const engagement = await db.query("INSERT INTO engagements (brief_id,proposal_id,brand_user_id,creator_user_id,title,milestones,due_date,status) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,'active') ON CONFLICT (proposal_id) DO NOTHING RETURNING *", [proposal.brief_id,id,String(user.id),String(proposal.creator_user_id),proposal.brief_title,JSON.stringify(proposal.milestones || []),proposal.deadline || null]);
    if (!engagement.rows[0]) return bad(res, 409, 'An engagement already exists for this proposal.');
    const updated = await db.query("UPDATE proposals SET status='accepted',updated_at=now() WHERE id=$1 AND status='submitted' RETURNING *", [id]);
    if (!updated.rows[0]) return bad(res, 409, 'The proposal status changed. Refresh and try again.');
    await audit(db, user.id, 'proposal', id, 'proposal_accepted', { engagement_id: engagement.rows[0].id });
    return res.json({ proposal: updated.rows[0], engagement: engagement.rows[0] });
  } catch (e) {
    if (String(e && e.message).toLowerCase().includes('active_proposal_unique_idx')) return bad(res, 409, 'You already have an active proposal for this brief.');
    console.error('proposal_api_error', e && e.message);
    return bad(res, 500, 'Proposal request failed.');
  }
}