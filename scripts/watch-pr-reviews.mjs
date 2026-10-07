#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const EXPECTED_REPO = 'trminhkhoi76-code/meridian-travel-atlas';
const args = new Set(process.argv.slice(2));
const watch = args.has('--watch');
const includeExisting = args.has('--include-existing');
const intervalMs = Math.max(10000, Number(process.env.AGENT_PR_WATCH_INTERVAL_MS || 30000));

function run(command, commandArgs) {
  try {
    return execFileSync(command, commandArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    const stderr = error?.stderr?.toString?.().trim();
    throw new Error(stderr || error.message);
  }
}

function json(command, commandArgs) {
  const out = run(command, commandArgs);
  return out ? JSON.parse(out) : null;
}

function assertRepoScope() {
  const root = run('git', ['rev-parse', '--show-toplevel']);
  const currentRepo = run('gh', ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner']);
  if (currentRepo !== EXPECTED_REPO) {
    throw new Error('Refusing to run outside ' + EXPECTED_REPO + '. Current repository is ' + (currentRepo || 'unknown') + '.');
  }
  return root;
}

function currentPr() {
  try {
    return json('gh', ['pr', 'view', '--json', 'number,url,state,isDraft,headRefName,baseRefName,title']);
  } catch {
    return null;
  }
}

function fetchItems(prNumber) {
  const issueComments = json('gh', ['api', 'repos/' + EXPECTED_REPO + '/issues/' + prNumber + '/comments?per_page=100']) || [];
  const reviews = json('gh', ['api', 'repos/' + EXPECTED_REPO + '/pulls/' + prNumber + '/reviews?per_page=100']) || [];
  const reviewComments = json('gh', ['api', 'repos/' + EXPECTED_REPO + '/pulls/' + prNumber + '/comments?per_page=100']) || [];

  return [
    ...issueComments.map((x) => ({
      key: 'issue-comment:' + x.id,
      type: 'conversation',
      author: x.user?.login,
      body: x.body || '',
      url: x.html_url,
      createdAt: x.created_at,
    })),
    ...reviews.map((x) => ({
      key: 'review:' + x.id,
      type: 'review',
      author: x.user?.login,
      body: x.body || '',
      state: x.state,
      url: x.html_url,
      createdAt: x.submitted_at,
    })),
    ...reviewComments.map((x) => ({
      key: 'review-comment:' + x.id,
      type: 'inline',
      author: x.user?.login,
      body: x.body || '',
      path: x.path,
      line: x.line ?? x.original_line ?? null,
      url: x.html_url,
      createdAt: x.created_at,
    })),
  ].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

function loadState(path) {
  if (!existsSync(path)) return { seen: [] };
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return { seen: [] }; }
}

function saveState(path, state) {
  writeFileSync(path, JSON.stringify(state, null, 2) + '\n');
}

function printItems(pr, items) {
  if (!items.length) return;
  console.log('\n[Meridian PR Review Inbox] PR #' + pr.number + ' — ' + pr.title);
  console.log(pr.url);
  for (const item of items) {
    console.log('\n---');
    console.log('[' + item.type + '] ' + (item.author || 'unknown') + ' @ ' + (item.createdAt || 'unknown time'));
    if (item.state) console.log('state: ' + item.state);
    if (item.path) console.log('file: ' + item.path + (item.line ? ':' + item.line : ''));
    console.log(item.body || '(no body)');
    if (item.url) console.log(item.url);
  }
  console.log('\nAgent action: verify feedback against AGENTS.md/CLAUDE.md and the linked issue, fix only justified findings, run required checks, push to the same PR branch, and do not merge.');
}

function poll(root, firstRun) {
  const pr = currentPr();
  if (!pr) {
    console.log('[Meridian PR Review Inbox] No pull request found for the current branch.');
    return;
  }
  if (pr.state !== 'OPEN') {
    console.log('[Meridian PR Review Inbox] PR #' + pr.number + ' is ' + pr.state + '; watcher will not process it.');
    return;
  }

  const statePath = join(root, '.git', 'meridian-agent-pr-watch.json');
  const state = loadState(statePath);
  const items = fetchItems(pr.number);
  const seen = new Set(state.seen || []);

  let fresh = [];
  if (firstRun && !includeExisting && seen.size === 0) {
    for (const item of items) seen.add(item.key);
    console.log('[Meridian PR Review Inbox] Watching PR #' + pr.number + '. Existing review items were baselined; only new feedback will be emitted.');
  } else {
    fresh = items.filter((item) => !seen.has(item.key));
    for (const item of fresh) seen.add(item.key);
    printItems(pr, fresh);
  }

  saveState(statePath, {
    repo: EXPECTED_REPO,
    pr: pr.number,
    branch: pr.headRefName,
    updatedAt: new Date().toISOString(),
    seen: [...seen],
  });
}

const root = assertRepoScope();
poll(root, true);

if (watch) {
  console.log('[Meridian PR Review Inbox] Polling every ' + Math.round(intervalMs / 1000) + 's. Ctrl+C to stop.');
  setInterval(() => {
    try { poll(root, false); } catch (error) { console.error('[Meridian PR Review Inbox] ' + error.message); }
  }, intervalMs);
}
