var plt = {
  // optional
  "label": "lineplot, parsed | spikey thing",
  // required
  "type": "lineplot",
  "parse": ["t % 10","t^2 % 5","3*sin(t)"],
  "start": 0,
  "end": 100,
  "step": 1/50
};

// var ss = new SimShim('#plot');
// ss.addPlot( plt );
// ss.start();
