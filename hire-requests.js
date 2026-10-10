import { db, auth, email } from 'hatchable';
import { textValue, listValue, numberValue, boolValue, bad, audit, isIsoDate } from 'lib/core.js';

export const access = 'user';
export const methods = ['GET','POST','PUT'];

function htmlEscape(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function money(value, currency) {
  return new Intl.NumberFormat('en-IN', { style:'currency', currency: currency || 'INR', maximumFractionDigits:0 }).format(Number(value || 0));
}
async function sendNotice(toUserId, subject, title, rows) {
  try {
    const result = await db.query('SELECT email FROM users WHERE id=$1 LIMIT 1', [String(toUserId)]);
    const to = result.rows[0] && result.rows[0].email;
    if (!to) return 'no_email';
    const html = '<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#28231e"><div style="padding:18px 22px;background:#f8f4ed;border-radius:14px"><h1 style="font-size:24px;margin:0 0 6px">CREOVA</h1><p style="margin:0;color:#9b553e">Creative work, thoughtfully commissioned.</p></div><h2>' + htmlEscape(title) + '</h2>' + rows.map(r => '<p><strong>' + htmlEscape(r[0]) + ':</strong> ' + htmlEscape(r[1] || 'Not specified') + '</p>').join('') + '<p style="margin-top:24px">Open your CREOVA workspace to review the request and respond.</p><p><a href="https://creova-ai-6jmu.hatchable.site/#/hiring" style="display:inline-block;background:#28231e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Open CREOVA</a></p><p style="font-size:12px;color:#776e63">This transactional message relates to a CREOVA hiring request.</p></div>';
    const text = title + '\n\n' + rows.map(r => r[0] + ': ' + (r[1] || 'Not specified')).join('\n') + '\n\nOpen your CREOVA workspace: https://creova-ai-6jmu.hatchable.site/#/hiring';
    await email.send({ to, subject, html, text });
    return 'sent';
  } catch (e) {
    console.error('hire_email_notice_failed', String(e && e.message || e).slice(0,180));
    return 'blocked_or_failed';
  }
}

export default async function (req, res) {
  try {
    const user = req.user || await auth.getUser(req);
    if (!user) return bad(res, 401, 'Please sign in to manage hiring requests.');
    const me = String(user.id);
    const profileResult = await db.query('SELECT role,display_name FROM app_profiles WHERE user_id=$1 LIMIT 1', [me]);
    const profile = profileResult.rows[0];
    if (!profile || !['creator','brand'].includes(profile.role)) return bad(res, 403, 'A creator or brand profile is required.');
    const role = profile.role;

    if (req.method === 'GET') {
      const sql = role === 'creator'
        ? "SELECT h.*,br.display_name AS brand_name,br.organization AS brand_organization,br.avatar_url AS brand_avatar FROM hire_requests h LEFT JOIN app_profiles br ON br.user_id=h.brand_user_id WHERE h.creator_user_id=$1 ORDER BY h.created_at DESC LIMIT 100"
        : "SELECT h.*,cr.display_name AS creator_name,cr.headline AS creator_headline,cr.location AS creator_location,cr.avatar_url AS creator_avatar FROM hire_requests h LEFT JOIN app_profiles cr ON cr.user_id=h.creator_user_id WHERE h.brand_user_id=$1 ORDER BY h.created_at DESC LIMIT 100";
      const result = await db.query(sql, [me]);
      return res.json({ requests: result.rows, role });
    }

    const b = req.body || {};
    const id = Number(b.id);
    if (req.method === 'POST') {
      if (role !== 'brand') return bad(res, 403, 'Only Brand / Agency accounts can send a hire request.');
      const creatorId = textValue(b.creator_user_id, 200);
      const title = textValue(b.project_title, 160);
      const description = textValue(b.work_description, 3000);
      const contentType = textValue(b.content_type, 100) || 'AI filmmaking';
      const budget = numberValue(b.proposed_budget, -1, 100000000);
      const currency = textValue(b.currency, 3).toUpperCase() || 'INR';
      const date = textValue(b.requested_date, 10);
      const time = textValue(b.requested_time, 20);
      const timezone = textValue(b.timezone, 80) || 'Asia/Kolkata';
      const duration = textValue(b.duration, 120);
      const deliverables = listValue(b.deliverables, 20);
      const formats = listValue(b.formats, 20);
      const licensing = textValue(b.licensing_requirements, 1200);
      const notes = textValue(b.extra_notes, 1600);
      if (!creatorId || !title || !description || budget < 0) return bad(res, 400, 'Add the creator, project title, work description, and proposed budget.');
      if (date && !isIsoDate(date)) return bad(res, 400, 'Choose a valid preferred date.');
      if (date && Date.parse(date + 'T23:59:59Z') < Date.now()) return bad(res, 400, 'The preferred date must be today or in the future.');
      const creatorResult = await db.query("SELECT user_id,display_name FROM app_profiles WHERE user_id=$1 AND role='creator' AND public_profile=true LIMIT 1", [creatorId]);
      const creator = creatorResult.rows[0];
      if (!creator) return bad(res, 404, 'That public creator profile could not be found.');
      if (creatorId === me) return bad(res, 400, 'You cannot hire your own profile.');
      const saved = await db.query(
        "INSERT INTO hire_requests (brand_user_id,creator_user_id,project_title,work_description,content_type,proposed_budget,currency,requested_date,requested_time,timezone,duration,deliverables,formats,commercial_use,licensing_requirements,extra_notes,status,email_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14,$15,$16,'pending','not_attempted') RETURNING *",
        [me,creatorId,title,description,contentType,budget,currency,date || null,time,timezone,duration,JSON.stringify(deliverables),JSON.stringify(formats),boolValue(b.commercial_use),licensing,notes]
      );
      await audit(db, me, 'hire_request', saved.rows[0].id, 'hire_request_created', { creator_user_id: creatorId, project_title: title });
      const brandName = textValue(profile.display_name,160) || 'A CREOVA brand';
      const emailStatus = await sendNotice(creatorId, 'New CREOVA hire request: ' + title, 'A brand wants to work with you', [
        ['Brand / agency', brandName], ['Project', title], ['Work', description], ['Content type', contentType],
        ['Proposed budget', money(budget,currency)], ['Preferred date', date || 'Flexible'], ['Preferred time', time || 'Flexible'],
        ['Time zone', timezone], ['Duration', duration || 'To be agreed'], ['Deliverables', deliverables.join(', ')],
        ['Formats', formats.join(', ')], ['Commercial use', boolValue(b.commercial_use) ? 'Required' : 'Not marked as required'],
        ['Licensing', licensing || 'Discuss before accepting'], ['Additional notes', notes || 'None']
      ]);
      await db.query('UPDATE hire_requests SET email_status=$1,updated_at=now() WHERE id=$2', [emailStatus, saved.rows[0].id]);
      return res.json({ request: { ...saved.rows[0], email_status: emailStatus }, email_status: emailStatus, message: emailStatus === 'sent' ? 'Hire request sent and email notification dispatched.' : 'Hire request saved. The recipient can review it in CREOVA; email delivery may be restricted by the current plan or recipient eligibility.' });
    }

    if (!Number.isSafeInteger(id) || id < 1) return bad(res, 400, 'A valid hire request is required.');
    const found = await db.query('SELECT * FROM hire_requests WHERE id=$1 AND (brand_user_id=$2 OR creator_user_id=$2) LIMIT 1', [id,me]);
    const request = found.rows[0];
    if (!request) return bad(res, 404, 'Hire request not found.');
    const action = textValue(b.action, 20);
    if (role === 'creator' && String(request.creator_user_id) === me && request.status === 'pending' && ['accept','decline'].includes(action)) {
      const status = action === 'accept' ? 'accepted' : 'declined';
      const updated = await db.query('UPDATE hire_requests SET status=$1,responded_at=now(),updated_at=now() WHERE id=$2 AND creator_user_id=$3 AND status=\'pending\' RETURNING *', [status,id,me]);
      if (!updated.rows[0]) return bad(res, 409, 'This request has already been answered.');
      await audit(db,me,'hire_request',id,'hire_request_'+status);
      const brandName = await db.query('SELECT display_name FROM app_profiles WHERE user_id=$1 LIMIT 1',[request.brand_user_id]);
      const creatorName = textValue(profile.display_name,160) || 'The creator';
      const emailStatus = await sendNotice(request.brand_user_id, 'CREOVA hire request ' + status + ': ' + request.project_title, 'The creator responded to your hire request', [
        ['Creator', creatorName], ['Project', request.project_title], ['Response', status.toUpperCase()],
        ['Preferred date', request.requested_date || 'Flexible'], ['Preferred time', request.requested_time || 'Flexible'],
        ['Budget', money(request.proposed_budget,request.currency)], ['Next step', status === 'accepted' ? 'Confirm the final scope, licensing, and delivery plan in CREOVA.' : 'You can contact another creator or revise your request.']
      ]);
      return res.json({ request: updated.rows[0], email_status: emailStatus, message: 'Request ' + status + '. Email notification status: ' + emailStatus + '.' });
    }
    if (role === 'brand' && String(request.brand_user_id) === me && request.status === 'pending' && action === 'cancel') {
      const updated = await db.query("UPDATE hire_requests SET status='cancelled',updated_at=now() WHERE id=$1 AND brand_user_id=$2 AND status='pending' RETURNING *",[id,me]);
      if (!updated.rows[0]) return bad(res,409,'This request can no longer be cancelled.');
      await audit(db,me,'hire_request',id,'hire_request_cancelled');
      return res.json({ request: updated.rows[0] });
    }
    return bad(res,403,'You cannot change this hire request.');
  } catch (e) {
    console.error('hire_requests_api_error', String(e && e.message || e).slice(0,240));
    return bad(res,500,'Hire request could not be completed. Please retry.');
  }
}