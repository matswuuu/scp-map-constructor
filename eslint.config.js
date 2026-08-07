import js from '@eslint/js'
import globals from 'globals'
import {globalIgnores} from 'eslint/config'

export default [
    globalIgnores(['dist']),
    {
        files: ['**/*.{js,jsx,mjs,cjs}'],
        ...js.configs.recommended,
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: globals.node,
        },
    },
]
