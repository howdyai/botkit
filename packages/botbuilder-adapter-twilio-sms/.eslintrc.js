module.exports = {
    "extends": "standard",
    "rules": {
        "semi": [2, "always"],
        "indent": [2, 4],
        "no-return-await": 0,
        "camelcase": 0,
        "no-unused-vars": 0,
        "@typescript-eslint/indent": 0,
        "@typescript-eslint/no-object-literal-type-assertion": 0,
        "@typescript-eslint/explicit-member-accessibility": 1,
        "space-before-function-paren": [2, {
            "named": "never",
            "anonymous": "never",
            "asyncArrow": "always"
        }],
        "template-curly-spacing": [2, "always"]
    }
};