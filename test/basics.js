/* (c) 2015 Ari Porad (@ariporad) <http://ariporad.com>. License: ariporad.mit-license.org */
import test from 'ava';
import rewire from 'rewire';
import { assertModule } from './helpers/utils';

const call = (f) => f();

test.beforeEach((t) => {
  t.context = rewire('../');
});

test('basics', (t) => {
  const reverts = [
    t.context.addHook((code) => code.replace('@@a', '<a>')),
    t.context.addHook((code) => code.replace('@@b', '<b>')),
  ];

  assertModule(t, 'basics-foo.js', 'in basics-foo <a> <b>');
  assertModule(t, 'basics-bar.js', 'in basics-bar <a> <b>');

  reverts.forEach(call);
});

test('prehook', (t) => {
  const reverts = [
    t.context.addHook((code) => code.replace('@@a', '<a>'), {
      preHook: (filename) =>
        filename.endsWith('foo.js') ? 'module.exports = "prehook-foo";' : null,
    }),
    t.context.addHook((code) => code.replace('@@b', '<b>'), {
      preHook: (filename) =>
        filename.endsWith('bar.js') ? 'module.exports = "prehook-bar";' : null,
    }),
  ];

  assertModule(t, 'basics-foo.js', 'prehook-foo');
  assertModule(t, 'basics-bar.js', 'prehook-bar');

  reverts.forEach(call);
});

test('prehook error', (t) => {
  const reverts = [
    t.context.addHook(
      (code, _, failed) => code.replace('@@a', failed ? '<e>' : '<b>'),
      {
        preHook: () => {
          throw new Error('Prehook fail');
        },
      },
    ),
    t.context.addHook(
      (code, _, failed) => code.replace('@@b', failed ? '<e>' : '<b>'),
      {
        preHook: (filename) =>
          filename.endsWith('bar.js') ? 'non-existing-variable' : null,
      },
    ),
  ];

  // eslint-disable-next-line no-console
  const olError = console.error;
  // eslint-disable-next-line no-console
  console.error = () => {};

  assertModule(t, 'basics-foo.js', 'in basics-foo <e> <b>');
  assertModule(t, 'basics-bar.js', 'in basics-bar <e> <e>');

  // eslint-disable-next-line no-console
  console.error = olError;

  reverts.forEach(call);
});

test('ignore node_modules inactive', (t) => {
  const reverts = [
    t.context.addHook((code) => code.replace('@@a', '<a>'), {
      ignoreNodeModules: false,
    }),
    t.context.addHook((code) => code.replace('@@b', '<b>'), {
      ignoreNodeModules: false,
    }),
  ];

  assertModule(t, 'node_modules/basic.js', 'in basics-bar <a> <b>');

  reverts.forEach(call);
});

test('ignore node_modules active', (t) => {
  const reverts = [
    t.context.addHook((code) => code.replace('@@a', '<a>'), {
      ignoreNodeModules: true,
    }),
    t.context.addHook((code) => code.replace('@@b', '<b>'), {
      ignoreNodeModules: true,
    }),
  ];
  assertModule(t, 'node_modules/basic.js', 'in basics-bar @@a @@b');

  reverts.forEach(call);
});

test('matchers', (t) => {
  const reverts = [
    t.context.addHook((code) => code.replace('@@a', '<a>'), {
      matcher: (filename) => filename.indexOf('foo') === -1,
    }),
    t.context.addHook((code) => code.replace('@@b', '<b>')),
  ];

  assertModule(t, 'basics-foo.js', 'in basics-foo @@a <b>');
  assertModule(t, 'basics-bar.js', 'in basics-bar <a> <b>');

  reverts.forEach(call);
});

test('matcher is called only once per file', (t) => {
  let timesMatcherCalled = 0;
  require.extensions['.foojs'] = require.extensions['.js'];
  const reverts = [
    t.context.addHook((code) => code, {
      matcher: () => {
        timesMatcherCalled++;
        return true;
      },
      exts: ['.js', '.foojs'],
    }),
    () => delete require.extensions['.foojs'],
  ];

  rewire('./fixture/basics-foo'); // Rewire doesn't use the require cache.
  rewire('./fixture/basics-foo.foojs'); // Rewire doesn't use the require cache.

  t.is(timesMatcherCalled, 2, 'matcher is only called once per file');

  reverts.forEach(call);
});

test('reverts to previous loader', (t) => {
  require.extensions['.foojs'] = require.extensions['.js'];
  const revert = t.context.addHook((code) => code.replace('@@a', '<a>'), {
    exts: ['.foojs'],
  });

  t.not(require.extensions['.foojs'], require.extensions['.js']);

  revert();

  t.is(require.extensions['.foojs'], require.extensions['.js']);
});

test('reverts to nothing if no previous loader', (t) => {
  const oldKeys = Object.keys(require.extensions);
  t.is(require.extensions['.foo2js'], undefined);
  const revert = t.context.addHook((code) => code.replace('@@a', '<a>'), {
    exts: ['.foo2js'],
  });

  t.not(require.extensions['.foo2js'], undefined);

  revert();

  t.is(require.extensions['.foo2js'], undefined);
  t.deepEqual(Object.keys(require.extensions), oldKeys);
});
