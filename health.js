import { db } from 'hatchable';
export const access = 'public';
export const methods = ['GET'];
export default async function (req, res) {
  try {
    await db.query('SELECT 1 AS ok');
    return res.json({ status:'ok', service:'CREOVA AI', database:'connected', timestamp:new Date().toISOString() });
  } catch (e) {
    console.error('health_check_error', e && e.message);
    return res.status(503).json({ status:'degraded', service:'CREOVA AI', database:'unavailable' });
  }
}