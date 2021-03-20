import * as assert from "assert";
import { getRanges } from './ranges';

describe('Ranges', function () {
  describe('#getRanges()', function () {
    const tests = [

      {
        name: 'class and function',
        text: `
class Foo {
  function bar() {

  }
}
`,
        want: [
          { start: 2, end: 4 },
          { start: 1, end: 5 },
        ],
      },

      {
        name: 'if else',
        text: `
if (condition1) {
  foo();
} else if (condition2) {
  bar();
} else {
  baz();
}
`,
        want: [
          { start: 1, end: 3 },
          { start: 3, end: 5 },
          { start: 5, end: 7 },
        ],
      },

      {
        name: 'try catch',
        text: `
try {
  foo();
} catch (Exception1 ex) {
  bar();
} catch (Exception2 ex) {
  baz();
}
`,
        want: [
          { start: 1, end: 3 },
          { start: 3, end: 5 },
          { start: 5, end: 7 },
        ],
      },

      {
        name: 'block comments over 1 line',
        text: `
/* */
`,
        want: [], // empty array
      },

      {
        name: 'block comments over 2 lines',
        text: `
/*
*/
`,
        want: [
          { start: 1, end: 2, type: 'blockComment' },
        ],
      },

      {
        name: 'block comments over 3 lines',
        text: `
/*

*/
`,
        want: [
          { start: 1, end: 3, type: 'blockComment' },
        ],
      },

      {
        name: 'block comments over 4 lines',
        text: `
/*
 * foo
 * bar
 */
`,
        want: [
          { start: 1, end: 4, type: 'blockComment' },
        ],
      },

      {
        name: 'braces over 1 line',
        text: `
{}
`,
        want: [], // empty array
      },

      {
        name: 'braces over 2 lines',
        text: `
{
}
`,
        want: [
          { start: 1, end: 2 },
        ],
      },

      {
        name: 'braces over 3 lines',
        text: `
{

}
`,
        want: [
          { start: 1, end: 3 },
        ],
      },

      {
        name: 'nested braces with 0 lines',
        text: `
{
  {
  }
}
`,
        want: [
          { start: 2, end: 3 },
          { start: 1, end: 4 },
        ],
      },

      {
        name: 'nested braces with 1 line',
        text: `
{
  {

  }
}
`,
        want: [
          { start: 2, end: 4 },
          { start: 1, end: 5 },
        ],
      },

      {
        name: 'single line comment within braces',
        text: `
{
// }
}
`,
        want: [
          { start: 1, end: 3 },
        ],
      },

      {
        name: 'invalid closing brace before proper braces',
        text: `
}
{

}
`,
        want: [
          { start: 2, end: 4 },
        ],
      },

    ];

    tests.forEach(tt => {
      it(tt.name, () => {
        const lines = tt.text.split('\n');
        const got = getRanges(lines.length, i => lines[i]);
        assert.deepStrictEqual(got, tt.want);
      });
    });
  });
});
