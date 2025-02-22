**This is a modified version of pirates, only used for a Discord client mod.**  
Changes include:
 - preHook option, bypasses the original js loader which bypasses the call to fs.readFileSync
   as well as bypasses the passed hook itself

### Properly hijack require

## Why?

Two reasons:
1. Babel and istanbul were breaking each other.
2. Everyone seemed to re-invent the wheel on this, and everyone wanted a solution that was DRY, simple, easy to use,
and made everything Just Work™, while allowing multiple require hooks, in a fashion similar to calling `super`.

For some context, see [the Babel issue thread][] which started this all, then [the nyc issue thread][], where
discussion was moved (as we began to discuss just using the code nyc had developed), and finally to [#1][issue-1]
where discussion was finally moved.

[the Babel issue thread]: https://github.com/babel/babel/pull/3062 "Babel Issue Thread"
[the nyc issue thread]: https://github.com/bcoe/nyc/issues/70 "NYC Issue Thread"
[issue-1]: https://github.com/danez/pirates/issues/1 "Issue #1"

## Installation

    npm install --save @astra-mod/pirates

## Usage

Using pirates is really easy:
```javascript
// my-module/register.js
const addHook = require('@astra-mod/pirates').addHook;
// Or if you use ES modules
// import { addHook } from '@astra-mod/pirates';

function matcher(filename) {
  // Here, you can inspect the filename to determine if it should be hooked or
  // not. Just return a truthy/falsey. Files in node_modules are automatically ignored,
  // unless otherwise specified in options (see below).

  // TODO: Implement your logic here
  return true;
}

const revert = addHook(
  (code, filename) => code.replace('@@foo', 'console.log(\'foo\');'),
  { exts: ['.js'], matcher }
);

// And later, if you want to un-hook require, you can just do:
revert();
```

## API

### pirates.addHook(hook, [opts={ [matcher: true], [exts: ['.js']], [ignoreNodeModules: true] }]);
Add a require hook. `hook` must be a function that takes `(code, filename)`, and returns the modified code. `opts` is
an optional options object. Available options are: `matcher`, which is a function that accepts a filename, and
returns a truthy value if the file should be hooked (defaults to a function that always returns true), falsey if
otherwise; `exts`, which is an array of extensions to hook, they should begin with `.` (defaults to `['.js']`);
`ignoreNodeModules`, if true, any file in a `node_modules` folder wont be hooked (the matcher also wont be called),
if false, then the matcher will be called for any files in `node_modules` (defaults to true).

As for the custom prehook property, you will get passed a filename, you can then return a pretranspiled version of
that module as a string.

## Projects that use Pirates

See the [wiki page](https://github.com/danez/pirates/wiki/Projects-using-Pirates). If you add Pirates to your project,
(And you should! It works best if everyone uses it. Then we can have a happy world full of happy require hooks!), please
add yourself to the wiki.
