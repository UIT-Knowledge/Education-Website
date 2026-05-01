#!/usr/bin/env node
/**
 * verify-animations.mjs
 * Lightweight validation for the landing-page animation upgrade.
 * Checks: file existence, CSS syntax (brace matching), JS syntax,
 *         key class/element presence.
 * Exit code 0 = all checks pass.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const DIR = resolve(import.meta.dirname ?? '.');
let failed = 0;

function check(description, ok) {
  if (ok) {
    console.log(`  ✓ ${description}`);
  } else {
    console.log(`  ✗ ${description}`);
    failed++;
  }
}

function readOrFail(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    console.log(`  ✗ File missing: ${path}`);
    failed++;
    return null;
  }
}

/* ── FILE EXISTENCE ── */
console.log('\n[File Existence]');
const required = ['index.html', 'styles.css', 'script.js', 'package.json'];
required.forEach(f => check(`Found ${f}`, existsSync(resolve(DIR, f))));

/* ── CSS BRACE MATCHING ── */
console.log('\n[CSS Syntax - Brace Count]');
const css = readOrFail('./styles.css');
if (css) {
  const opens = (css.match(/\{/g) || []).length;
  const closes = (css.match(/\}/g) || []).length;
  check(`CSS braces match (${opens} open, ${closes} close)`, opens === closes);
  check('CSS has @keyframes before edit (expect existing or zero)', css.includes('@keyframes'));
}

/* ── CSS SELECTOR CHECKS (pre-existing baseline) ── */
console.log('\n[CSS Baseline Selectors]');
if (css) {
  check('.reveal class exists', /\.reveal\b/.test(css));
  check('.reveal.visible exists', /\.reveal\s*\.visible/.test(css));
  check('.hero-atmosphere exists', /\.hero-atmosphere/.test(css));
  check('.hero-grain exists', /\.hero-grain/.test(css));
  check('@media (prefers-reduced-motion: reduce) exists', /prefers-reduced-motion/.test(css));
  check('@media (hover: hover) exists', /@media\s*\(hover:\s*hover\)/.test(css));
}

/* ── HTML CHECKS ── */
console.log('\n[HTML Structure]');
const html = readOrFail('./index.html');
if (html) {
  check('<html> has lang attribute', /<html[^>]*\blang=['"][^'"]+['"]/.test(html));
  check('Viewport meta present', /<meta[^>]*viewport/.test(html));
  check('.hero-atmosphere element exists', /class="[^"]*hero-atmosphere[^"]*"/.test(html));
  check('.reveal elements exist (at least one)', /class="[^"]*\breveal\b[^"]*"/.test(html));
  check('script.js loaded', /script\.js/.test(html));
  check('styles.css linked', /styles\.css/.test(html));
  check('Supabase reference intact', /supabase\.js/.test(html));
  check('<main> element exists', /<main/.test(html));

  // Count <section> elements
  const sections = html.match(/<section/g) || [];
  check(`Section elements (${sections.length})`, sections.length >= 3);
}

/* ── JS SYNTAX ── */
console.log('\n[JavaScript Syntax]');
const js = readOrFail('./script.js');
if (js) {
  // Check for basic syntax by evaluating in strict mode
  try {
    new Function(js);
    check('script.js parses without syntax error', true);
  } catch (e) {
    check(`script.js syntax error: ${e.message}`, false);
  }

  check('IntersectionObserver used', /IntersectionObserver/.test(js));
  check('Supabase integration preserved', /supabaseClient/.test(js));
  check('FAQ accordion function exists', /initFAQAccordion/.test(js));
  check('Merch carousel function exists', /initMerchCarousel/.test(js));
  check('Counter animation exists', /hero-stat-number/.test(js));
  check('Smooth scroll anchors', /scrollTo[\s\S]*behavior:\s*['"]smooth['"]/.test(js));
}

/* ── NEW ANIMATION FEATURES ── */
console.log('\n[Animation Upgrade Features]');
if (css) {
  check('aurora-drift keyframe exists', css.includes('@keyframes aurora-drift'));
  check('aurora-drift-2 keyframe exists', css.includes('@keyframes aurora-drift-2'));
  check('float-orb-1 keyframe exists', css.includes('@keyframes float-orb-1'));
  check('float-orb-2 keyframe exists', css.includes('@keyframes float-orb-2'));
  check('float-orb-3 keyframe exists', css.includes('@keyframes float-orb-3'));
  check('grain-shift keyframe exists', css.includes('@keyframes grain-shift'));
  check('shimmer-btn keyframe exists', css.includes('@keyframes shimmer-btn'));
  check('.hero-orb class exists', /\.hero-orb\b/.test(css));
  check('.reveal has filter: blur', /filter:\s*blur/.test(css));
  check('new reveal duration is 0.9s', /0\.9s/.test(css.match(/\.reveal\s*\{[^}]*/)?.[0] || ''));
  check('hero-glow-1 has animation', /hero-glow-1[\s\S]*?animation:/.test(css));
  check('hero-glow-2 has animation', /hero-glow-2[\s\S]*?animation:/.test(css));
  check('MR fallback for new animations', css.includes('hero-orb') && css.includes('animation: none'));
}

if (js) {
  check('Reveal stagger cap at 600ms', /Math\.min\(index \* 100, 600\)/.test(js));
}

if (html) {
  check('hero-orb-1 element in HTML', /hero-orb-1/.test(html));
  check('hero-orb-2 element in HTML', /hero-orb-2/.test(html));
  check('hero-orb-3 element in HTML', /hero-orb-3/.test(html));
}

/* ── BUILD CAPABILITY ── */
console.log('\n[Build]');
const pkg = readOrFail('./package.json');
if (pkg) {
  check('build script defined', /"build"/.test(pkg));
}

/* ── RESULT ── */
console.log(`\n${failed === 0 ? '✓ ALL CHECKS PASSED' : `✗ ${failed} CHECK(S) FAILED`}\n`);
process.exit(failed > 0 ? 1 : 0);
