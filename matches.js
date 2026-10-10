import { db } from 'hatchable';
import { textValue, bad, makeMatchScore } from 'lib/core.js';
export const access = 'user';
export const methods = ['GET'];
const norm = xs => (Array.isArray(xs) ? xs : []).map(x => String(x).toLowerCase());
export default async function (req, res) {
  try {
    const user = req.user;
    if (!user) return bad(res, 401, 'Sign in as a brand to see creator matches.');
    const profile = await db.query('SELECT role FROM app_profiles WHERE user_id=$1 LIMIT 1', [String(user.id)]);
    if (!profile.rows[0] || profile.rows[0].role !== 'brand') return bad(res, 403, 'Creator matching is available to Brand / Agency accounts.');
    const briefId = Number(req.query && req.query.brief_id);
    if (!Number.isSafeInteger(briefId) || briefId < 1) return bad(res, 400, 'Choose a brief to match.');
    const found = await db.query("SELECT * FROM briefs WHERE id=$1 AND brand_user_id=$2 AND status IN ('draft','published') LIMIT 1", [briefId,String(user.id)]);
    const brief = found.rows[0];
    if (!brief) return bad(res, 404, 'Brief not found or not yours.');
    const all = await db.query("SELECT * FROM app_profiles WHERE role='creator' AND public_profile=true ORDER BY updated_at DESC LIMIT 500");
    const matches = [], excluded = [];
    for (const creator of all.rows) {
      const reasons = [];
      const priceMin = Number(creator.price_min || 0), priceMax = Number(creator.price_max || 0);
      if (creator.availability === 'unavailable') reasons.push('Marked unavailable');
      if (Number(brief.budget_max) > 0 && priceMin > Number(brief.budget_max)) reasons.push('Minimum price exceeds brief budget');
      if (Number(brief.budget_min) > 0 && priceMax > 0 && priceMax < Number(brief.budget_min)) reasons.push('Maximum price is below brief budget');
      if (brief.commercial_use && creator.commercial_use_declared !== true) reasons.push('Commercial-use rights are not declared');
      const wantedFormats = norm(brief.formats), creatorFormats = norm(creator.formats);
      if (wantedFormats.length && creatorFormats.length && !wantedFormats.some(x => creatorFormats.some(y => x.includes(y) || y.includes(x)))) reasons.push('Declared formats do not match');
      const candidate = { user_id:creator.user_id,display_name:creator.display_name,headline:creator.headline,location:creator.location,avatar_url:creator.avatar_url,skills:creator.skills,tools:creator.tools,categories:creator.categories,formats:creator.formats,availability:creator.availability,price_min:creator.price_min,price_max:creator.price_max,currency:creator.currency };
      if (reasons.length) { excluded.push({ ...candidate, exclusion_reasons:reasons }); continue; }
      const score = makeMatchScore(creator,brief);
      matches.push({ ...candidate, match_score:score.score, match_reasons:score.reasons, rights_note:score.caution });
    }
    matches.sort((a,b) => b.match_score-a.match_score);
    return res.json({ brief_id:briefId, matches, excluded, scoring:'Deterministic weighted compatibility: skills 26%, tools 18%, content type 18%, formats 10%, budget 12%, availability 8%, declared commercial-use fit 8%. Eligibility conflicts are excluded before ranking.', total_eligible:matches.length, total_excluded:excluded.length });
  } catch (e) { console.error('match_api_error', e && e.message); return bad(res, 500, 'Creator matching failed.'); }
}