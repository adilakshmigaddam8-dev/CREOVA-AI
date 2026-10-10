import { db, auth, storage } from 'hatchable';
import { textValue, listValue, bad } from 'lib/core.js';
export const access = 'public';
export const methods = ['GET','POST','PUT','DELETE'];
async function signedItems(rows) {
  return Promise.all(rows.map(async row => ({ ...row, media_url: row.media_key ? await storage.url(row.media_key) : row.media_url })));
}
export default async function (req, res) {
  try {
    const user = req.user || await auth.getUser(req);
    if (req.method === 'GET') {
      const creator = textValue(req.query && req.query.creator, 200);
      if (creator) {
        const found = await db.query("SELECT * FROM portfolio_items WHERE creator_user_id=$1 AND visibility='public' ORDER BY created_at DESC LIMIT 60", [creator]);
        return res.json({ items: await signedItems(found.rows) });
      }
      if (!user) return bad(res, 401, 'Sign in to manage your portfolio.');
      const mine = await db.query('SELECT * FROM portfolio_items WHERE creator_user_id=$1 ORDER BY created_at DESC LIMIT 100', [String(user.id)]);
      return res.json({ items: await signedItems(mine.rows) });
    }
    if (!user) return bad(res, 401, 'Please sign in to continue.');
    const roleResult = await db.query('SELECT role FROM app_profiles WHERE user_id=$1 LIMIT 1', [String(user.id)]);
    if (!roleResult.rows[0] || roleResult.rows[0].role !== 'creator') return bad(res, 403, 'Only creator accounts can manage portfolios.');
    const b = req.body || {};
    const id = Number(b.id);
    if (req.method === 'DELETE') {
      if (!Number.isSafeInteger(id) || id < 1) return bad(res, 400, 'A valid portfolio item is required.');
      const deleted = await db.query('DELETE FROM portfolio_items WHERE id=$1 AND creator_user_id=$2 RETURNING id,media_key', [id, String(user.id)]);
      if (!deleted.rows[0]) return bad(res, 404, 'Portfolio item not found.');
      if (deleted.rows[0].media_key) await storage.del(deleted.rows[0].media_key).catch(() => {});
      return res.json({ ok: true });
    }
    const title = textValue(b.title, 140);
    if (!title) return bad(res, 400, 'Add a title before saving.');
    const mediaKey = typeof b.media_key === 'string' && b.media_key.startsWith('uploads/' + String(user.id) + '/') ? b.media_key.slice(0, 500) : '';
    const mediaUrl = /^https?:\/\/\S+$/i.test(textValue(b.media_url, 1000)) ? textValue(b.media_url, 1000) : '';
    const vals = [
      String(user.id), title, textValue(b.description, 1800), mediaUrl, mediaKey,
      ['image','video','animation','other'].includes(b.media_type) ? b.media_type : 'image',
      textValue(b.content_type, 100) || 'AI filmmaking', textValue(b.visual_style, 140),
      JSON.stringify(listValue(b.tools)), JSON.stringify(listValue(b.workflow)),
      JSON.stringify(listValue(b.skills)), JSON.stringify(listValue(b.formats)),
      textValue(b.rights_status, 40) || 'self-reported', textValue(b.license_notes, 1000),
      b.visibility === 'private' ? 'private' : 'public'
    ];
    if (req.method === 'POST') {
      const saved = await db.query('INSERT INTO portfolio_items (creator_user_id,title,description,media_url,media_key,media_type,content_type,visual_style,tools,workflow,skills,formats,rights_status,license_notes,visibility) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb,$13,$14,$15) RETURNING *', vals);
      return res.json({ item: (await signedItems(saved.rows))[0] });
    }
    if (!Number.isSafeInteger(id) || id < 1) return bad(res, 400, 'A valid portfolio item is required.');
    const updateVals = vals.slice(1);
    updateVals.push(id, String(user.id));
    const sql = 'UPDATE portfolio_items SET title=$1,description=$2,media_url=$3,media_key=$4,media_type=$5,content_type=$6,visual_style=$7,tools=$8::jsonb,workflow=$9::jsonb,skills=$10::jsonb,formats=$11::jsonb,rights_status=$12,license_notes=$13,visibility=$14,updated_at=now() WHERE id=$15 AND creator_user_id=$16 RETURNING *';
    const saved = await db.query(sql, updateVals);
    if (!saved.rows[0]) return bad(res, 404, 'Portfolio item not found.');
    return res.json({ item: (await signedItems(saved.rows))[0] });
  } catch (e) { console.error('portfolio_api_error', e && e.message); return bad(res, 500, 'Portfolio request failed.'); }
}