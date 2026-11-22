const crypto = require('crypto');

const PREFIX = 'enc:v1:';

function getKey() {
  const secret = process.env.DATA_ENCRYPTION_KEY || process.env.JWT_SECRET || '';
  if (!secret) {
    throw new Error('DATA_ENCRYPTION_KEY ou JWT_SECRET doit être configuré pour le chiffrement.');
  }
  return crypto.createHash('sha256').update(String(secret)).digest();
}

function chiffrer(texte) {
  if (texte === null || texte === undefined) return texte;
  const str = String(texte);
  if (!str) return str;
  if (str.startsWith(PREFIX)) return str;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(str, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function dechiffrer(valeur) {
  if (valeur === null || valeur === undefined) return valeur;
  const str = String(valeur);
  if (!str.startsWith(PREFIX)) return str; // Donnée historique en clair
  try {
    const parts = str.slice(PREFIX.length).split(':');
    if (parts.length !== 3) return str;
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    return '[Contenu illisible]';
  }
}

module.exports = { chiffrer, dechiffrer };
