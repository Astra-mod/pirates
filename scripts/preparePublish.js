const { spawn } = require('child_process');

function run(command) {
  // eslint-disable-next-line no-console
  console.log(`Running: ${command}`);
  return new Promise((resolve, reject) => {
    const childProcess = spawn(
      process.platform === 'win32' ? 'bash' : '/bin/bash',
      ['-c', command],
      { stdio: 'inherit' },
    );
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed: ${command}`));
      }
    });
  });
}

async function main() {
  // Linting sub-projects requires the latest Sucrase types, so require a build first.
  await run(`rm -rf ./build`);
  await run('mkdir ./build');
  await run('cp -r ./lib ./build/lib');
  await run('cp ./index.d.ts ./build/index.d.ts');
  await run('cp ./LICENSE ./build/LICENSE');
  await run('cp ./package.json ./build/package.json');
  await run('cp ./README.md ./build/README.md');
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled error:');
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});
