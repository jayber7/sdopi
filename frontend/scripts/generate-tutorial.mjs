#!/usr/bin/env node
import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync, mkdirSync, mkdtempSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { tmpdir } from 'os';

const ROOT = join(import.meta.dirname, '..');
const PROJECT = join(import.meta.dirname, '..', '..');
const TEST_RESULTS = join(ROOT, 'test-results');
const TUTORIAL_OUT = join(ROOT, 'tutorial-output');
const SPEC = join(ROOT, 'tests', 'cao-full-flow.spec.ts');
const VOICE = 'es-BO-MarceloNeural';
const REPORT = join(TEST_RESULTS, 'tutorial-steps.json');
const BACKEND_PORT = 3001;
const FRONTEND_PORT = 3000;

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  return execSync(cmd, { stdio: 'inherit', ...opts });
}

async function waitForPort(port, label, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`http://localhost:${port}`);
      if (r.ok || r.status < 500) { console.log(`  ${label} is ready`); return; }
    } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`${label} did not start within ${timeoutMs}ms`);
}

function isPortOpen(port) {
  try {
    execSync(`ss -tlnp | grep -q ":${port} "`, { stdio: 'ignore' });
    return true;
  } catch { return false; }
}

function listVideos(dir) {
  const files = [];
  function walk(d) {
    try {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name.endsWith('.webm')) files.push(p);
      }
    } catch {}
  }
  walk(dir);
  return files;
}

async function main() {
  console.log('=== SDOP Tutorial Generator ===\n');

  mkdirSync(TUTORIAL_OUT, { recursive: true });

  // Step 0 - ensure servers are running
  console.log('Step 0: Checking required servers...');

  if (!isPortOpen(BACKEND_PORT)) {
    console.log('  Starting backend API on port 3001...');
    const bg = spawn('node', ['dist/main.js'], {
      cwd: join(PROJECT, 'backend'),
      stdio: 'pipe',
      detached: true,
      env: { ...process.env, PORT: String(BACKEND_PORT), SKIP_EVIDENCE_CHECK: 'true' },
    });
    bg.stdout?.on('data', d => process.stdout.write(`[backend] ${d}`));
    bg.stderr?.on('data', d => process.stderr.write(`[backend] ${d}`));
    await waitForPort(BACKEND_PORT, 'Backend API');
  } else {
    console.log('  Backend API already running on 3001');
  }

  if (!isPortOpen(FRONTEND_PORT)) {
    console.log('  Starting frontend on port 3000...');
    const bg = spawn('npx', ['next', 'dev', '-p', String(FRONTEND_PORT)], {
      cwd: ROOT,
      stdio: 'pipe',
      detached: true,
    });
    bg.stdout?.on('data', d => process.stdout.write(`[frontend] ${d}`));
    bg.stderr?.on('data', d => process.stderr.write(`[frontend] ${d}`));
    await waitForPort(FRONTEND_PORT, 'Frontend');
  } else {
    console.log('  Frontend already running on 3000');
  }

  // Step 1 - run the test
  console.log('\nStep 1: Running Playwright test with video...');
  run(`npx playwright test "${SPEC}"`, { cwd: ROOT, timeout: 600_000 });

  // Step 2 - extract step names and find video from reporter JSON
  console.log('\nStep 2: Reading test results...');
  let steps = [];
  let videoPath = '';
  if (existsSync(REPORT)) {
    const report = JSON.parse(readFileSync(REPORT, 'utf-8'));
    const results = report.suites?.[0]?.specs?.[0]?.tests?.[0]?.results || [];
    const passedResult = results.find(r => r.status === 'passed') || results[results.length - 1];
    if (passedResult?.steps) {
      steps = collectSteps(passedResult.steps);
    }
    const vid = passedResult?.attachments?.find(a => a.contentType === 'video/webm');
    if (vid?.path) videoPath = vid.path;
  }
  if (!videoPath) {
    const videos = listVideos(TEST_RESULTS);
    videoPath = videos.find(v => v.includes('retry')) || videos[0] || '';
  }
  if (!videoPath) {
    console.error('ERROR: no .webm video found in test-results/');
    process.exit(1);
  }
  console.log(`  Video: ${videoPath}`);
  if (steps.length === 0) {
    console.error('ERROR: no steps found in report. Make sure test ran with test.step() calls.');
    process.exit(1);
  }
  console.log(`  Found ${steps.length} steps:`);
  steps.forEach((s, i) => console.log(`    ${i + 1}. ${s.title}`));

  // Step 3 - generate TTS per step
  console.log('\nStep 3: Generating TTS narration with edge-tts...');
  const tempDir = mkdtempSync(join(tmpdir(), 'tutorial-'));
  const audioParts = [];

  for (const [i, step] of steps.entries()) {
    const outFile = join(tempDir, `step-${String(i).padStart(2, '0')}.mp3`);
    console.log(`  [${i + 1}/${steps.length}] "${step.title}"`);
    run(`edge-tts --voice ${VOICE} --text "${escapeShell(step.title)}" --write-media "${outFile}"`, { timeout: 30_000 });
    audioParts.push(outFile);
  }

  // Step 4 - concat all audio parts into one narration
  console.log('\nStep 4: Concatenating audio segments...');
  const concatFile = join(tempDir, 'audio-list.txt');
  const concatList = audioParts.map(f => `file '${f}'`).join('\n');
  writeFileSync(concatFile, concatList);
  const fullAudio = join(tempDir, 'full-narration.mp3');
  run(`ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy "${fullAudio}"`);

  // Step 5 - merge audio into video
  console.log('\nStep 5: Composing final tutorial video...');
  const videoName = basename(videoPath, '.webm');
  const outputFile = join(TUTORIAL_OUT, `${videoName}-tutorial.mp4`);
  run(`ffmpeg -y -i "${videoPath}" -i "${fullAudio}" -c:v libx264 -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${outputFile}"`);

  // Cleanup
  run(`rm -rf "${tempDir}"`);

  console.log(`\n=== Done! ===`);
  console.log(`Output: ${outputFile}`);
  console.log(`Duration: audio on video (narration length determines output)`);
}

function collectSteps(steps, depth = 0) {
  const result = [];
  for (const s of steps) {
    result.push({ title: s.title, depth });
    if (s.steps?.length) {
      result.push(...collectSteps(s.steps, depth + 1));
    }
  }
  return result;
}

function escapeShell(s) {
  return s.replace(/'/g, "'\\''");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
