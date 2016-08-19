var plt = {
  // optional
  "label": "helix",
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

var ss = new SimShim('#plot');
ss.addPlot( plt );
ss.start();
