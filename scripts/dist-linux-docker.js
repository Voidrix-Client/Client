#!/usr/bin/env node
// Builds the Linux .deb package inside a Docker container.
//
// electron-builder cannot produce a .deb on a Windows host: packaging tools
// like dpkg-deb/fakeroot only exist on Linux, and native npm modules must be
// installed against a Linux ABI. This script runs that step inside the
// official electron-builder Docker image so `npm run dist-all` still works
// end-to-end from Windows.
//
// Requires Docker Desktop to be installed and running. Nothing here installs
// or configures Docker itself.

const { spawnSync } = require('child_process');
const path = require('path');

const projectDir = path.resolve(__dirname, '..');
// The ":base" tag has the Linux packaging tools (dpkg-deb, fakeroot, rpmbuild)
// but no Node.js. The numbered tags add Node on top of that same base image.
const BUILDER_IMAGE = 'electronuserland/builder:22';

function run(command, args) {
    return spawnSync(command, args, { stdio: 'inherit' });
}

function dockerAvailable() {
    const version = run('docker', ['version', '--format', '{{.Server.Version}}']);
    return version.status === 0;
}

console.log('[dist-linux-docker] Checking for Docker...');
if (!dockerAvailable()) {
    console.error(
        '\n[dist-linux-docker] Docker Desktop was not found or is not running.\n' +
        'Building a .deb package requires a real Linux environment (dpkg-deb, fakeroot,\n' +
        'and Linux-native npm modules), which Windows cannot provide directly.\n\n' +
        'One-time setup:\n' +
        '  1. Install Docker Desktop: https://www.docker.com/products/docker-desktop\n' +
        '  2. Start Docker Desktop and wait for it to say "Docker is running".\n' +
        '  3. Re-run: npm run dist-all\n'
    );
    process.exit(1);
}

console.log('[dist-linux-docker] Docker is available. Building .deb in a Linux container...');

const containerCommand = [
    'npm ci --prefer-offline --no-audit --no-fund',
    'npx electron-builder --linux deb --publish never',
].join(' && ');

const dockerArgs = [
    'run', '--rm',
    '-v', `${projectDir}:/project`,
    '-v', 'voidrix_electron_cache:/root/.cache/electron',
    '-v', 'voidrix_electron_builder_cache:/root/.cache/electron-builder',
    '-v', 'voidrix_linux_node_modules:/project/node_modules',
    '-w', '/project',
    BUILDER_IMAGE,
    'bash', '-c', containerCommand,
];

const result = run('docker', dockerArgs);

if (result.status !== 0) {
    console.error('\n[dist-linux-docker] Linux build failed. See output above for details.');
    process.exit(result.status ?? 1);
}

console.log('[dist-linux-docker] .deb build complete. Check the release/ folder.');
