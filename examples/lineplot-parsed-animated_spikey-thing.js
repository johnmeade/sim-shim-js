var plt = {
  // optional
  "label": "lineplot, parsed, animated | spikey thing",
  // required
  "type": "lineplot",
  "animated": true,
  "parse": ["-t % 10","-t^2 % 5","3*sin(t)"],
  "lineLength": 1000,
  "start": 0,
  "step": 1/50
};

// var ss = new SimShim('#plot');
// ss.addPlot( plt );
// ss.start();
