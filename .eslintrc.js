module.exports = {
  plugins: ["prettier", "chai-friendly"],
  env: {
    browser: true,
    node: true,
    es6: true,
    mocha: true,
    es2020: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
  },
  extends: ["airbnb-base", "plugin:prettier/recommended"],
  rules: {
    "prettier/prettier": "error",

    // allow importing dev dependencies for tests
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: ["**/*.unit.js"],
      },
    ],

    "no-unused-expressions": 0,
    "chai-friendly/no-unused-expressions": 2,

    "no-throw-literal": 0,
    "prefer-promise-reject-errors": 0,

    "no-underscore-dangle": 0,
    camelcase: 0,

    // disable this warning as it's too hard to fix
    "func-names": 0,
  },
};
