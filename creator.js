import { db, storage } from 'hatchable';
import { textValue, bad } from 'lib/core.js';
export const access = 'public';
export const methods = ['GET'];
export default async function (req,res) {
  try {
    const id=textValue(req.query && req.query.user_id,200);
    if(!id)return bad(res,400,'A creator id is required.');
    const found=await db.query("SELECT user_id,display_name,headline,bio,location,organization,industry,website,avatar_url,skills,tools,categories,formats,languages,availability,commercial_use_declared,price_min,price_max,currency,updated_at FROM app_profiles WHERE user_id=$1 AND role='creator' AND public_profile=true AND lower(display_name) NOT LIKE '%smoke test%' AND lower(headline) NOT LIKE '%temporary profile for automated workflow checks%' LIMIT 1",[id]);
    if(!found.rows[0])return bad(res,404,'Public creator profile not found.');
    const portfolio=await db.query("SELECT * FROM portfolio_items WHERE creator_user_id=$1 AND visibility='public' ORDER BY created_at DESC LIMIT 60",[id]);
    const items=await Promise.all(portfolio.rows.map(async p=>({...p,media_url:p.media_key?await storage.url(p.media_key):p.media_url})));
    const creator=found.rows[0];
    if(!Array.isArray(creator.categories)||creator.categories.length===0){const relevant=['UI/UX Design','Web Design','Graphic Design','Brand Identity','AI filmmaking','Animation','Advertising','Motion graphics','Image generation','Art direction','Digital Content Design'];creator.categories=(creator.skills||[]).filter(s=>relevant.some(r=>r.toLowerCase()===String(s).toLowerCase()));}
    if(!Array.isArray(creator.formats)||creator.formats.length===0){creator.formats=[...new Set(items.flatMap(p=>Array.isArray(p.formats)?p.formats:[]))];}
    const verified=await db.query("SELECT id,portfolio_item_id,claim_type,claim,status,reviewed_at FROM verification_records WHERE creator_user_id=$1 AND status IN ('verified','evidence_submitted') ORDER BY created_at DESC LIMIT 100",[id]);
    return res.json({creator,portfolio:items,verification:verified.rows});
  }catch(e){console.error('creator_detail_error',e&&e.message);return bad(res,500,'Could not load this creator profile.');}
}