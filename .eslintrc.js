module.exports = {
  "extends": "airbnb-base",
  rules: {
    semi: [2, 'never'],
    'class-methods-use-this': 0,
    'prefer-rest-params': 0,
    'constructor-super': 0,
    'comma-dangle': [2, 'never'],
    'no-throw-literal': 0,
    'object-curly-newline': [2, {
      ObjectPattern: "never"
    }],
    'arrow-parens': [2, 'as-needed', {
      requireForBlockBody: false
    }],
    'no-return-assign': [2, 'except-parens'],
    'no-param-reassign': [2, {
      props: false
    }],
    'no-underscore-dangle': [2, {
      allow: ['_id']
    }]
  }
}
