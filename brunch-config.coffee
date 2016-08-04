fs = require 'fs'

LICENSES = 'LICENSES.js'
OUT_FILE = 'sim-shim-bundle'

module.exports =
  files:
    javascripts:
      joinTo: OUT_FILE + '.js'

  paths:
    watched: ['src', 'vendor']
    public: 'dist'

  modules:
    # require('src/SimShim') => require('SimShim')
    nameCleaner: (path) => path.replace(/^src\//, '')

  # uglify is run by default in production mode. Rename output to have '.min'
  overrides:
    production:
      files:
        javascripts:
          joinTo: OUT_FILE + '.min.js'
      sourceMaps: true

  hooks:
    onCompile: (genFiles, changedAssets) ->
      # write licenses
      f = genFiles[0].path
      lic = fs.readFileSync(LICENSES)
      fs.appendFile f, lic, (err) => throw new Error("Couldn't write Licenses!")
