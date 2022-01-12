#!/bin/node

'use strict';

// Usage:
//   cat package-lock.json | node rebasePackageLock.mjs https://your-project.pkgs.visualstudio.com/_packaging/your-feed/npm/registry/ > new-package-lock.json

async function readAllStdin() {
  return new Promise((resolve, reject) => {
    const bufferList = [];
    let numBytes = 0;

    process.stdin.on('close', () => {
      resolve(Buffer.concat(bufferList, numBytes));
    });

    process.stdin.on('data', buffer => {
      bufferList.push(buffer);
      numBytes += buffer.length;
    });

    process.stdin.on('error', reject);
  });
}

function rebaseV1Inline(name, dependency, baseURL) {
  const { resolved: actual, version } = dependency;
  const singleName = name.split('/').reverse()[0];

  const { href: expected } = new URL(`${name}/-/${singleName}-${version}.tgz`, 'https://registry.npmjs.org/');
  const { href: rebased } = new URL(`${name}/-/${singleName}-${version}.tgz`, baseURL);

  if (expected !== actual) {
    throw new Error(`v1: Expecting "resolved" field to be "${expected}", actual is "${actual}".`);
  }

  dependency.resolved = rebased;

  rebaseV1InlineAll(dependency, baseURL);
}

function rebaseV1InlineAll({ dependencies }, baseURL) {
  for (const [name, dependency] of Object.entries(dependencies || {})) {
    rebaseV1Inline(name, dependency, baseURL);
  }
}

function rebaseV2Inline(path, dependency, baseURL) {
  const { resolved: actual, version } = dependency;
  const name = path.split('node_modules/').reverse()[0];

  const singleName = name.split('/').reverse()[0];

  const { href: expected } = new URL(`${name}/-/${singleName}-${version}.tgz`, 'https://registry.npmjs.org/');
  const { href: rebased } = new URL(`${name}/-/${singleName}-${version}.tgz`, baseURL);

  if (expected !== actual) {
    throw new Error(`v2: Expecting "resolved" field to be "${expected}", actual is "${actual}".`);
  }

  dependency.resolved = rebased;
}

function rebaseV2InlineAll(packages, baseURL) {
  for (const [path, dependency] of Object.entries(packages || {})) {
    // "path" is falsy if it is iterating the current package.
    path && rebaseV2Inline(path, dependency, baseURL);
  }
}

async function main() {
  const baseURL = process.argv[2];

  if (!baseURL) {
    throw new Error('New registry base URL must be passed as first argument.');
  }

  const packageLockJSON = JSON.parse(await readAllStdin());

  // v1
  rebaseV1InlineAll(packageLockJSON, baseURL);

  // v2
  rebaseV2InlineAll(packageLockJSON.packages, baseURL);

  const json = JSON.stringify(packageLockJSON, null, 2);

  if (~json.indexOf('://registry.npmjs.org')) {
    throw new Error('After rebase, "://registry.npmjs.org" should not be detected in the output.');
  }

  console.log(json);
}

main();
