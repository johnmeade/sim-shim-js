module.exports = {
  files:
    javascripts:
      joinTo:
        'sim-shim-bundle.js'
      order:
        before: /^vendor/
        after: /^src/

  paths:
    watched: ['src', 'vendor']
    public: 'dist'

  plugins:
    babel:
      presets: ['es2015']
      pattern: /\.(js|es6)/

  modules:
    nameCleaner: (path) => path.replace(/^src\//, '')

}
