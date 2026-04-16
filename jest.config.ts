import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

// Wrap createJestConfig to override transformIgnorePatterns after next/jest sets them
async function jestConfig() {
  const nextJestConfig = await createJestConfig(config)()
  return {
    ...nextJestConfig,
    moduleNameMapper: {
      ...nextJestConfig.moduleNameMapper,
      // Resolve @/ alias for jest.mock() runtime resolution (SWC handles compile-time only)
      '^@/(.*)$': '<rootDir>/$1',
    },
    transformIgnorePatterns: [
      // Allow all ESM packages used by react-markdown (including nested node_modules)
      'node_modules/(?!.pnpm)(?!(react-markdown|remark-gfm|remark-parse|remark-rehype|remark-stringify|rehype-react|unified|bail|is-plain-obj|trough|vfile|vfile-message|unist-util-.*|mdast-util-.*|micromark.*|decode-named-character-reference|character-entities|character-entities-legacy|character-entities-html4|character-reference-invalid|property-information|hast-util-.*|space-separated-tokens|comma-separated-tokens|trim-lines|devlop|estree-util-.*|html-url-attributes|html-void-elements|longest-streak|markdown-table|zwitch|ccount|parse-entities|is-alphanumerical|is-alphabetical|is-decimal|is-hexadecimal|stringify-entities|escape-string-regexp)/)',
      // Handle escape-string-regexp nested inside mdast-util-find-and-replace
      'node_modules/mdast-util-find-and-replace/node_modules/(?!(escape-string-regexp)/)',
    ],
  }
}

export default jestConfig
