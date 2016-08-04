var plt = {
  // optional
  "label": "lineplot, animated | parametric spiral",
  "color": "#55ee11",
  // custom keys (used only in "next" function)
  "t": 0,
  "dt": 1/50,
  // required
  "type": "lineplot",
  "animated": true,
  "lineLength": 10000, // buffered geometry is fixed size
  "next": function () {
      var t = this.t;
      var p = [Math.sin(t), Math.cos(t), t/10];
      this.t += this.dt;
      this.t = this.t % 100;
      return p;
  },
};

// var SimShim = require('SimShim');
// var ss = new SimShim('#plot');
// ss.addPlot( plt );
// ss.start();
