import {readdirSync,readFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {join,dirname,resolve} from 'node:path';
let failed=false;
for(const file of readdirSync('dist/js').filter(f=>f.endsWith('.js'))){const p=join('dist/js',file),r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(r.status){process.stderr.write(r.stderr);failed=true}for(const match of readFileSync(p,'utf8').matchAll(/from\s*['"]([^'"]+)['"]/g)){const target=resolve(dirname(p),match[1].split('?')[0]);if(match[1].startsWith('.')&&!existsSync(target)){console.error('Missing module:',target);failed=true}}}
for(const file of readdirSync('dist').filter(f=>f.endsWith('.html'))){for(const m of readFileSync(join('dist',file),'utf8').matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(?:https?:|data:|mailto:)/.test(m[1]))continue;const p=m[1].split(/[?#]/)[0];if(p&&!existsSync(join('dist',p))){console.error('Missing asset/link:',file,m[1]);failed=true}}}
if(failed)process.exit(1);console.log('JavaScript, module imports, page links and local assets checked.');
