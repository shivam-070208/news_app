// Root-level ESLint config for a Turborepo workspace using flat config.
// App/package lint rules live in each workspace's eslint.config.js.

/** @type {import("eslint").FlatConfig[]} */
module.exports = [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/.turbo/**",
      "**/coverage/**",
    ],
  },
]
