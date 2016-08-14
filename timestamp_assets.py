import re, time, os
from os.path import join, split

pattern = re.compile(r'(<script.*src="[^http].*)\.js(".*></script>)')
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
            with open(path, 'w') as g:
                g.write( stamp(g.read()) )

# print(stamp('''
# <div id="plot"></div>
# <script type="text/javascript" src="https://code.jquery.com/jquery-1.11.1.min.js"></script>
# <script type="text/javascript" src="../assets/js/sim-shim-bundle.js"></script>
# <script type="text/javascript" src="../assets/js/sim-shim-bundle.js"></script>
# '''))
