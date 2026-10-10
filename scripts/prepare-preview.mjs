// Preview-only publishing: retain the exact deployed production artifact at the root.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { tmpdir } from 'node:os';

const repo = 'JDBiggs60/electrical-wiring-simulator';
const productionCommit = 'ef403a7747cd426126bbfbaf5e8675ab86a1c146';
const productionRun = '38063306444';
const productionURL = 'https://jdbiggs60.github.io/electrical-wiring-simulator/';
const site = resolve('_preview-site');
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
function gh(args) {
  try { return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
  catch { throw new Error('GitHub artifact/API request failed. No deployment was performed.'); }
}
async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error('Symbolic links are not permitted in this Pages artifact.');
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}
async function verifyProduction(manifest) {
  for (const { path, sha256 } of manifest) {
    // Dotfiles remain in the artifact but Pages does not serve them as public assets.
    if (path.split('/').some(part => part.startsWith('.'))) continue;
    const response = await fetch(productionURL + path.split('/').map(encodeURIComponent).join('/'), { cache: 'no-store' });
    if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== sha256) {
      throw new Error(`Production differs at ${path}. Refusing to publish or replace its files.`);
    }
  }
}

if (gh(['api', `repos/${repo}/commits/main`, '--jq', '.sha']) !== productionCommit) {
  throw new Error('main has changed since the production deployment. Refresh the baseline before publishing a preview.');
}
let archive = process.env.PRODUCTION_ARCHIVE;
if (!archive) {
  const downloadDir = join(tmpdir(), 'ocw-production-pages');
  await rm(downloadDir, { recursive: true, force: true });
  await mkdir(downloadDir, { recursive: true });
  gh(['run', 'download', productionRun, '--repo', repo, '--name', 'github-pages', '--dir', downloadDir]);
  archive = join(downloadDir, 'artifact.tar');
}
await rm(site, { recursive: true, force: true });
await mkdir(site, { recursive: true });
// Validate members before extraction; use Python's safe extraction filter as well.
execFileSync('python3', ['-c', `
import pathlib, sys, tarfile
root = pathlib.Path(sys.argv[2]).resolve()
with tarfile.open(sys.argv[1]) as archive:
    for member in archive.getmembers():
        target = (root / member.name).resolve()
        if not target.is_relative_to(root) or not (member.isfile() or member.isdir()):
            raise RuntimeError('Unsafe artifact member')
    archive.extractall(root, filter='data')
`, archive, site]);
const productionFiles = await walk(site);
if (!productionFiles.some(p => relative(site, p) === 'index.html')) throw new Error('Missing production index.html.');
if (productionFiles.some(p => relative(site, p).startsWith('preview/'))) throw new Error('Existing preview path detected; refusing to overwrite it.');
const manifest = await Promise.all(productionFiles.map(async p => ({ path: relative(site, p), sha256: hash(await readFile(p)) })));
await verifyProduction(manifest);
await cp(resolve('dist'), join(site, 'preview'), { recursive: true });
await writeFile(join(site, 'preview', 'production-manifest.json'), JSON.stringify({ productionCommit, productionRun, files: manifest }, null, 2));
for (const entry of manifest) {
  if (hash(await readFile(join(site, entry.path))) !== entry.sha256) throw new Error('Production file changed during packaging.');
}
await verifyProduction(manifest);
console.log(`Prepared /preview/; all ${manifest.length} production files preserved byte for byte and matched against the live website.`);
