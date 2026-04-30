'use strict';
const fs = require('fs');
const path = require('path');

// Wraps the electron binary with a shell script that injects --no-sandbox.
// AppImages cannot contain SUID binaries, so chrome-sandbox inside the squashfs
// never has mode 4755. Chromium's sandbox check runs at C++ startup (before any
// JS), so app.commandLine.appendSwitch() is always too late. Replacing the
// binary with a wrapper ensures --no-sandbox is in argv[0] from the OS level.
module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'linux') return;

  const appOutDir = context.appOutDir;
  const execName = context.packager.executableName || 'kit';
  const projectDir = context.packager.projectDir;
  const binaryPath = path.join(appOutDir, execName);

  // Copy AppImage icon (.DirIcon) from project icons directory
  try {
    const iconSrc = path.join(projectDir, 'build', 'icons', 'png', '256x256.png');
    const iconDest = path.join(appOutDir, '.DirIcon');
    if (fs.existsSync(iconSrc)) {
      fs.copyFileSync(iconSrc, iconDest);
      console.log('[afterPack] copied .DirIcon for AppImage');
    }
  } catch (e) { console.warn('[afterPack] .DirIcon copy failed:', e.message); }

  if (!fs.existsSync(binaryPath)) {
    console.warn(`[afterPack] binary not found: ${binaryPath}`);
    return;
  }

  // Read first 2 bytes — if already '#!' it's already a script wrapper
  const magic = Buffer.alloc(2);
  const fd = fs.openSync(binaryPath, 'r');
  fs.readSync(fd, magic, 0, 2, 0);
  fs.closeSync(fd);
  if (magic.toString() === '#!') {
    console.log('[afterPack] wrapper already in place, skipping');
    return;
  }

  // Rename the real Electron ELF binary
  const realPath = binaryPath + '.real';
  fs.renameSync(binaryPath, realPath);

  // Create a shell wrapper that prepends --no-sandbox
  fs.writeFileSync(
    binaryPath,
    `#!/bin/bash\nexec "$(dirname "$(readlink -f "$0")")/${execName}.real" --no-sandbox "$@"\n`,
    { mode: 0o755 }
  );

  console.log(`[afterPack] injected --no-sandbox wrapper for ${execName}`);
};
