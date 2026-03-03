#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const PACKAGE_NAME = 'iron-horse';
const SKILLS_URL = 'https://raw.githubusercontent.com/pelletencate/iron-horse/main/skills/';

const args = process.argv.slice(2);
const command = args[0];

if (command === 'install') {
  install();
} else if (command === 'uninstall') {
  uninstall();
} else {
  console.log(`iron-horse — Rails 8 domain skills for OpenCode\n`);
  console.log(`Usage:`);
  console.log(`  iron-horse install     Add iron-horse to your OpenCode config`);
  console.log(`  iron-horse uninstall   Remove iron-horse from your OpenCode config`);
  process.exit(0);
}

function findConfigFile() {
  const candidates = [
    'opencode.jsonc',
    'opencode.json',
    '.opencode/opencode.jsonc',
    '.opencode/opencode.json',
  ];
  for (const candidate of candidates) {
    const full = join(process.cwd(), candidate);
    if (existsSync(full)) return full;
  }
  return join(process.cwd(), 'opencode.json');
}

function readConfig(configPath) {
  if (!existsSync(configPath)) return {};
  const raw = readFileSync(configPath, 'utf8');
  try {
    const stripped = raw.replace(/^\s*\/\/.*$/gm, '');
    return JSON.parse(stripped);
  } catch {
    console.error(`Error: Could not parse ${configPath}`);
    process.exit(1);
  }
}

function writeConfig(configPath, config) {
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
}

function install() {
  const configPath = findConfigFile();
  const config = readConfig(configPath);
  let changed = false;

  config.plugin = config.plugin ?? [];
  const hasPlugin = config.plugin.some(
    (p) => p === PACKAGE_NAME || p.startsWith(`${PACKAGE_NAME}@`)
  );
  if (!hasPlugin) {
    config.plugin.push(PACKAGE_NAME);
    changed = true;
  }

  config.skills = config.skills ?? {};
  config.skills.urls = config.skills.urls ?? [];
  if (!config.skills.urls.includes(SKILLS_URL)) {
    config.skills.urls.push(SKILLS_URL);
    changed = true;
  }

  if (changed) {
    writeConfig(configPath, config);
    console.log(`✓ iron-horse added to ${configPath}`);
  } else {
    console.log(`✓ iron-horse already configured in ${configPath}`);
  }

  console.log();
  console.log(`  Plugin:  ${PACKAGE_NAME} (bootstrap prompt injection)`);
  console.log(`  Skills:  23 domain skills via skills.urls`);
  console.log();
  console.log(`Run opencode to start. Skills load on demand via skill("hotwire"), skill("models"), etc.`);
}

function uninstall() {
  const configPath = findConfigFile();
  if (!existsSync(configPath)) {
    console.log('No opencode config file found. Nothing to uninstall.');
    return;
  }

  const config = readConfig(configPath);
  let changed = false;

  if (config.plugin) {
    const before = config.plugin.length;
    config.plugin = config.plugin.filter(
      (p) => p !== PACKAGE_NAME && !p.startsWith(`${PACKAGE_NAME}@`)
    );
    if (config.plugin.length === 0) delete config.plugin;
    if ((config.plugin?.length ?? 0) < before) changed = true;
  }

  if (config.skills?.urls) {
    const before = config.skills.urls.length;
    config.skills.urls = config.skills.urls.filter((u) => u !== SKILLS_URL);
    if (config.skills.urls.length === 0) delete config.skills.urls;
    if (Object.keys(config.skills).length === 0) delete config.skills;
    if ((config.skills?.urls?.length ?? 0) < before) changed = true;
  }

  if (changed) {
    writeConfig(configPath, config);
    console.log(`✓ iron-horse removed from ${configPath}`);
  } else {
    console.log(`✓ iron-horse was not configured in ${configPath}`);
  }
}
