"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.message = exports.code = void 0;
exports.code = 'E1001';
exports.message = {
    code: exports.code,
    title: 'Duplicate Packages',
    type: 'markdown',
    category: 'bundle',
    description: `
#### Description

There is a same name package which is bundled in multiple versions in your application.

This negatively impacts the bundle size of your application.

#### General Solution

Add an entry in \`resolve.alias\` to configure Webpack to route any package references to a single specified path.

For example, if \`lodash\` is duplicated in your bundle, the following configuration would make all Lodash imports refer to the \`lodash\` instance found at \`./node_modules/lodash\`:

\`\`\`js
{
  alias: {
    lodash: path.resolve(__dirname, 'node_modules/lodash')
  }
}
\`\`\`
`,
};
