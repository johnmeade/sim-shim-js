fs = require 'fs'

module.exports =
  files:
    javascripts:
      joinTo: 'sim-shim-bundle.js'

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
          joinTo: 'sim-shim-bundle.min.js'
      sourceMaps: true

  hooks:
    onCompile: (genFiles, changedAssets) ->
      # write licenses
      f = genFiles[0] # only one output
      lic = fs.readFileSync('LICENSES.js') # read existing contents into data
      fs.appendFile f.path, lic, (err) =>
        throw "Couldn't write Licenses!"
