import { db } from 'hatchable';
import { textValue, listValue, numberValue, boolValue, bad } from 'lib/core.js';
export const access = 'user';
export const methods = ['GET','POST'];
export default async function (req, res) {
  try {
    const user = req.user;
    if (!user) return bad(res, 401, 'Please sign in to continue.');
    if (req.method === 'GET') {
      const result = await db.query('SELECT * FROM app_profiles WHERE user_id = $1 LIMIT 1', [String(user.id)]);
      return res.json({ profile: result.rows[0] || null, user: { id: user.id, email: user.email, name: user.name || '' } });
    }
    const b = req.body || {};
    const found = await db.query('SELECT role FROM app_profiles WHERE user_id = $1 LIMIT 1', [String(user.id)]);
    const role = found.rows[0] ? found.rows[0].role : (b.role === 'brand' ? 'brand' : 'creator');
    const values = [
      String(user.id), role, textValue(b.display_name || user.name, 120), textValue(b.headline, 180), textValue(b.bio, 1500),
      textValue(b.location, 120), textValue(b.organization, 160), textValue(b.industry, 100), textValue(b.website, 250),
      textValue(b.avatar_url, 1000), JSON.stringify(listValue(b.skills)), JSON.stringify(listValue(b.tools)),
      JSON.stringify(listValue(b.categories)), JSON.stringify(listValue(b.formats)), JSON.stringify(listValue(b.languages)),
      ['open','limited','unavailable'].includes(b.availability) ? b.availability : 'open',
      boolValue(b.commercial_use_declared), numberValue(b.price_min), numberValue(b.price_max), textValue(b.currency, 8).toUpperCase() || 'USD',
      b.public_profile === undefined ? true : boolValue(b.public_profile)
    ];
    const sql = 'INSERT INTO app_profiles (user_id,role,display_name,headline,bio,location,organization,industry,website,avatar_url,skills,tools,categories,formats,languages,availability,commercial_use_declared,price_min,price_max,currency,public_profile) ' +
      'VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13::jsonb,$14::jsonb,$15::jsonb,$16,$17,$18,$19,$20,$21) ' +
      'ON CONFLICT (user_id) DO UPDATE SET display_name=EXCLUDED.display_name,headline=EXCLUDED.headline,bio=EXCLUDED.bio,location=EXCLUDED.location,organization=EXCLUDED.organization,industry=EXCLUDED.industry,website=EXCLUDED.website,avatar_url=EXCLUDED.avatar_url,skills=EXCLUDED.skills,tools=EXCLUDED.tools,categories=EXCLUDED.categories,formats=EXCLUDED.formats,languages=EXCLUDED.languages,availability=EXCLUDED.availability,commercial_use_declared=EXCLUDED.commercial_use_declared,price_min=EXCLUDED.price_min,price_max=EXCLUDED.price_max,currency=EXCLUDED.currency,public_profile=EXCLUDED.public_profile,updated_at=now() RETURNING *';
    const saved = await db.query(sql, values);
    await db.query('INSERT INTO audit_events (actor_user_id,entity_type,entity_id,action,details) VALUES ($1,$2,$3,$4,$5::jsonb)', [String(user.id),'profile',String(saved.rows[0].id),'profile_saved',JSON.stringify({ role })]);
    return res.json({ profile: saved.rows[0] });
  } catch (e) { console.error('profile_api_error', e && e.message); return bad(res, 500, 'Unable to save profile right now.'); }
}