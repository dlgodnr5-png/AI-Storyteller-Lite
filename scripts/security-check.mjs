import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.cwd();
const ALLOWED_EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.md', '.html', '.env']);
const IGNORE_DIRS = new Set(['node_modules', 'dist', '.git']);
const IGNORE_FILES = new Set(['package-lock.json']);

const PATTERNS = [
  { name: 'Google OAuth client secret', regex: /GOCSPX-[A-Za-z0-9_-]{10,}/g },
  { name: 'Google API key', regex: /AIza[0-9A-Za-z_-]{20,}/g },
  { name: 'Assigned client secret', regex: /(?:GOOGLE_CLIENT_SECRET|VITE_GOOGLE_CLIENT_SECRET)\s*=\s*[^\s]+/g },
];

const violations = [];

const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (IGNORE_DIRS.has(name)) continue;
    const full = join(dir, name);
    const rel = full.replace(ROOT + '\\', '').replace(ROOT + '/', '');
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full);
      continue;
    }
    if (IGNORE_FILES.has(name)) continue;
    const ext = extname(name).toLowerCase();
    if (!ALLOWED_EXT.has(ext) && !name.startsWith('.env')) continue;

    const text = readFileSync(full, 'utf-8');
    for (const pattern of PATTERNS) {
      const matched = text.match(pattern.regex);
      if (!matched) continue;
      for (const value of matched) {
        const allowPlaceholder =
          name === '.env.example' &&
          (value.includes('your-google-client-id') || value.includes('your-restricted-youtube-api-key') || value.includes('your-domain.com') || value.includes('your-secret'));
        if (!allowPlaceholder) {
          violations.push({ file: rel, rule: pattern.name, value });
        }
      }
    }
  }
};

walk(ROOT);

if (violations.length > 0) {
  console.error('Security check failed. Remove sensitive keys before build/push.');
  for (const v of violations) {
    console.error(`- ${v.file}: ${v.rule} (${v.value.slice(0, 24)}...)`);
  }
  process.exit(1);
}

console.log('Security check passed.');
