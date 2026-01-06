module.exports = {
  root: true,

  env: {
    browser: true,
    es2021: true,
    node: true
  },

  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },

  settings: {
    react: {
      version: "detect"
    }
  },

  plugins: [
    "react",
    "react-hooks",
    "react-refresh"
  ],

  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],

  rules: {
    // React 17+ không cần import React
    "react/react-in-jsx-scope": "off",

    // Vite HMR
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true }
    ]
  },

  ignorePatterns: [
    "dist/",
    "node_modules/"
  ]
};
