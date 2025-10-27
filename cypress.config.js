const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://covoit.goegilles.fr',
    defaultCommandTimeout: 10000,
    video: false,
    screenshotOnRunFailure: true,
  },
})