module.exports = {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/test/**/*.test.{js,ts,tsx}"],
  testPathIgnorePatterns: ["/dist/", "/docs/", "/lib/", "/node_modules/"],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
};
