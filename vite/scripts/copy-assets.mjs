#!/usr/bin/env node
/**
 * Copies Unity assets into vite/public for the web build.
 * Sprites: Assets/sprites → public/sprites
 * Audio: Assets/sounds → public/audio (.aiff → .mp3 when ffmpeg is available)
 *
 * Run from vite/: npm run assets
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const viteDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(viteDir, '..');
const publicDir = path.join(viteDir, 'public');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

let ffmpegAvailable = false;
try {
  execSync('ffmpeg -version', { stdio: 'ignore' });
  ffmpegAvailable = true;
} catch (_) {}

if (!ffmpegAvailable) {
  console.warn(
    'ffmpeg not found; JPEG-as-PNG sprites and .aiff audio will copy as-is. Install ffmpeg for conversion.'
  );
}

function isJpeg(filePath) {
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(3);
  fs.readSync(fd, buf, 0, 3, 0);
  fs.closeSync(fd);
  return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function spriteSize(filePath) {
  const out = execSync(
    `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${filePath}"`,
    { encoding: 'utf8' }
  ).trim();
  const [w, h] = out.split(',').map(Number);
  return { w, h };
}

function isNearWhite(r, g, b) {
  return r >= 240 && g >= 240 && b >= 240;
}

function isNearBlack(r, g, b) {
  return r <= 18 && g <= 18 && b <= 18;
}

/**
 * JPEG splat art has a white canvas + 1px black frame. Global white-key would
 * also punch out white bands on the worm, so flood-fill from the edges only.
 */
function jpegToTransparentPng(srcPath, destPath) {
  const { w, h } = spriteSize(srcPath);
  const rgbPath = destPath + '.rgb';
  const rgbaPath = destPath + '.rgba';
  execSync(`ffmpeg -y -i "${srcPath}" -f rawvideo -pix_fmt rgb24 "${rgbPath}"`, {
    stdio: 'ignore',
  });
  const rgb = fs.readFileSync(rgbPath);
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const o = i * 3;
    const d = i * 4;
    rgba[d] = rgb[o];
    rgba[d + 1] = rgb[o + 1];
    rgba[d + 2] = rgb[o + 2];
    rgba[d + 3] = 255;
  }

  const seen = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (seen[i]) return;
    const o = i * 3;
    const r = rgb[o];
    const g = rgb[o + 1];
    const b = rgb[o + 2];
    const onRim = x <= 1 || y <= 1 || x >= w - 2 || y >= h - 2;
    if (isNearWhite(r, g, b) || (onRim && isNearBlack(r, g, b))) {
      seen[i] = 1;
      stack.push(i);
    }
  };

  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }

  while (stack.length) {
    const i = stack.pop();
    const d = i * 4;
    rgba[d] = 0;
    rgba[d + 1] = 0;
    rgba[d + 2] = 0;
    rgba[d + 3] = 0;
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) {
      const ni = i - 1;
      if (!seen[ni] && isNearWhite(rgb[ni * 3], rgb[ni * 3 + 1], rgb[ni * 3 + 2])) {
        seen[ni] = 1;
        stack.push(ni);
      }
    }
    if (x < w - 1) {
      const ni = i + 1;
      if (!seen[ni] && isNearWhite(rgb[ni * 3], rgb[ni * 3 + 1], rgb[ni * 3 + 2])) {
        seen[ni] = 1;
        stack.push(ni);
      }
    }
    if (y > 0) {
      const ni = i - w;
      if (!seen[ni] && isNearWhite(rgb[ni * 3], rgb[ni * 3 + 1], rgb[ni * 3 + 2])) {
        seen[ni] = 1;
        stack.push(ni);
      }
    }
    if (y < h - 1) {
      const ni = i + w;
      if (!seen[ni] && isNearWhite(rgb[ni * 3], rgb[ni * 3 + 1], rgb[ni * 3 + 2])) {
        seen[ni] = 1;
        stack.push(ni);
      }
    }
  }

  fs.writeFileSync(rgbaPath, rgba);
  execSync(
    `ffmpeg -y -f rawvideo -pix_fmt rgba -s ${w}x${h} -i "${rgbaPath}" "${destPath}"`,
    { stdio: 'ignore' }
  );
  fs.unlinkSync(rgbPath);
  fs.unlinkSync(rgbaPath);
}

/** Unity stored worm splat JPEGs with a .png extension. Pixi needs real PNG + alpha. */
function copySpriteFile(srcPath, destPath) {
  if (ffmpegAvailable && isJpeg(srcPath)) {
    jpegToTransparentPng(srcPath, destPath);
    console.log('Converted JPEG sprite', path.basename(srcPath));
    return;
  }
  fs.copyFileSync(srcPath, destPath);
}

function copyRecursive(src, dest) {
  ensureDir(dest);
  for (const name of fs.readdirSync(src)) {
    if (name.endsWith('.meta')) continue;
    const srcPath = path.join(src, name);
    const destPath = path.join(dest, name);
    if (fs.statSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      copySpriteFile(srcPath, destPath);
    }
  }
}

const spritesSrc = path.join(repoRoot, 'Assets', 'sprites');
const spritesDest = path.join(publicDir, 'sprites');
if (fs.existsSync(spritesSrc)) {
  ensureDir(path.dirname(spritesDest));
  copyRecursive(spritesSrc, spritesDest);
  console.log('Sprites copied to public/sprites');
} else {
  console.warn('Assets/sprites not found');
}

const audioSrc = path.join(repoRoot, 'Assets', 'sounds');
const audioDest = path.join(publicDir, 'audio');
ensureDir(audioDest);

if (fs.existsSync(audioSrc)) {
  for (const name of fs.readdirSync(audioSrc)) {
    if (name.endsWith('.meta')) continue;
    const srcPath = path.join(audioSrc, name);
    if (!fs.statSync(srcPath).isFile()) continue;
    const base = path.basename(name, path.extname(name));
    const ext = name.toLowerCase();
    if (ext.endsWith('.aiff') && ffmpegAvailable) {
      const destMp3 = path.join(audioDest, base + '.mp3');
      execSync(`ffmpeg -y -i "${srcPath}" -codec:a libmp3lame -q:a 4 "${destMp3}"`, {
        stdio: 'ignore',
      });
    } else if (ext.endsWith('.aiff')) {
      fs.copyFileSync(srcPath, path.join(audioDest, name));
    } else {
      fs.copyFileSync(srcPath, path.join(audioDest, name));
    }
  }
  console.log('Audio copied to public/audio');
} else {
  console.warn('Assets/sounds not found');
}
