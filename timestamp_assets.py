'''
script to iterate through all index.html files and add a timestamp as a GET
query param to all local <script> tags. This is run whenever an asset is changed
to bust browser caches.

eg, if index.html contains this line:
`<script type="text/javascript" src="../assets/js/sim-shim-bundle.js"></script>`
or this line:
`<script type="text/javascript" src="../assets/js/sim-shim-bundle.js?t=123"></script>`
it will be mapped to this line:
`<script type="text/javascript" src="../assets/js/sim-shim-bundle.js?t=1471211091"></script>`
'''

import re, time, os
from os.path import join, split

pattern = re.compile(r'(<script.*src="[^http].*)\.js.*(".*></script>)')
query = "\\g<1>.js?t=%d\\g<2>"%int(round(time.time()))
stamp = lambda x: pattern.sub(query, x)
cwd = os.getcwd()
iwalk = os.walk( cwd )
ignore_dirs = ['assets','tmp']

for root, dirs, files in iwalk:
    if split( root )[-1] in ignore_dirs: continue
    for f in files:
        if f == 'index.html':
            path = join(root, f)
            with open(path, 'r') as g:
                buf = g.read()
            with open(path, 'w') as g:
                g.write(stamp(buf))
