import { storage, db } from 'hatchable';
import crypto from 'node:crypto';
import { bad } from 'lib/core.js';
export const access = 'user';
export const methods = ['POST'];
const MAX_BYTES = 10 * 1024 * 1024;
const MIME_EXT = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp', 'image/gif':'gif', 'video/mp4':'mp4', 'video/webm':'webm' };
function sniff(bytes, mime) {
  if (!bytes || bytes.length < 4) return false;
  if (mime === 'image/jpeg') return bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
  if (mime === 'image/png') return bytes[0]===137 && bytes[1]===80 && bytes[2]===78 && bytes[3]===71;
  if (mime === 'image/gif') return bytes[0]===71 && bytes[1]===73 && bytes[2]===70 && bytes[3]===56;
  if (mime === 'image/webp') return String.fromCharCode(...bytes.slice(0,4))==='RIFF' && String.fromCharCode(...bytes.slice(8,12))==='WEBP';
  if (mime === 'video/mp4') return String.fromCharCode(...bytes.slice(4,8))==='ftyp';
  if (mime === 'video/webm') return bytes[0]===26 && bytes[1]===69 && bytes[2]===223 && bytes[3]===163;
  return false;
}
export default async function (req, res) {
  try {
    const user = req.user;
    if (!user) return bad(res, 401, 'Please sign in before uploading.');
    const file = (req.files || []).find(f => f.field === 'file');
    if (!file) return bad(res, 400, 'Choose a file to upload.');
    if (!file.buffer || file.buffer.length > MAX_BYTES) return bad(res, 413, 'File too large. Maximum size is 10 MB.');
    if (!MIME_EXT[file.contentType]) return bad(res, 415, 'Use JPG, PNG, WebP, GIF, MP4, or WebM.');
    if (!sniff(file.buffer, file.contentType)) return bad(res, 415, 'The file content does not match its declared type.');
    const role = await db.query('SELECT role FROM app_profiles WHERE user_id=$1 LIMIT 1', [String(user.id)]);
    const folder = role.rows[0] && role.rows[0].role === 'brand' ? 'briefs' : 'portfolio';
    const key = 'uploads/' + String(user.id) + '/' + folder + '/' + crypto.randomUUID() + '.' + MIME_EXT[file.contentType];
    const url = await storage.put(key, file.buffer, file.contentType);
    return res.json({ url, key, content_type: file.contentType, bytes: file.buffer.length });
  } catch (e) { console.error('upload_api_error', e && e.message); return bad(res, 500, 'Upload failed. Try a smaller file or try again.'); }
}