'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _utilFunctional = require('./util-functional');

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RungeKutta = (function () {

  /*|
  |*|  Creates an explicit Runge Kutta solver given a Butcher Tableau.
  |*|
  |*|  'A' is the Runge-Kutta matrix
  |*|  'b' is the vector of weights
  |*|  'c' is the vector of nodes
  |*|  'h' is the step size
  |*|
  |*|  A must be a lower triangular matrix of size n by n
  |*|  b and c must be dimension n
  |*/

  function RungeKutta(A, b, c, h) {
    _classCallCheck(this, RungeKutta);

    this.A = A;
    this.b = b;
    this.c = c;
    this.h = h;
    this.n = A.length;
  }

  // compute one step. supplied f must have signature f(t,vector)

  _createClass(RungeKutta, [{
    key: 'step',
    value: function step(f, t, y) {
      var _this = this;

      ks = [];
      for (var i = 0; i < this.n; i++) {
        var ti = t + this.c[i] * this.h,
            yi = y + this.h * ks.reduce(function (acc, ki, j) {
          return acc + _this.A[i][j] * ki;
        }, 0);
        ks.push(f(ti, yi));
      }
      return y + h * (0, _utilFunctional.zip)(this.b, ks).reduce(function (acc, tup) {
        return acc + tup[0] * tup[1];
      }, 0);
    }

    // checks the condition for a consistent RK method (google it...)

  }, {
    key: 'isConsistent',
    value: function isConsistent() {
      var bools = this.a.reduce(function (vec, row, i) {
        var rowsum = row.reduce(function (sum, aij, j) {
          if (j < i) return sum + aij;else return sum;
        }, 0);
        vec.push(c[i] == rowsum);
      }, []);
      return bools.reduce(function (acc, bool) {
        return acc && bool;
      }, true);
    }
  }]);

  return RungeKutta;
})();

var RK4 = (function (_RungeKutta) {
  _inherits(RK4, _RungeKutta);

  // The classic Runge-Kutta 4 method

  function RK4(h) {
    _classCallCheck(this, RK4);

    A = [[0, 0, 0, 0], [0.5, 0, 0, 0], [0, 0.5, 0, 0], [0, 0, 1, 0]];
    b = [1 / 6, 1 / 3, 1 / 3, 1 / 6];
    c = [0, 0.5, 0.5, 1];
    return _possibleConstructorReturn(this, Object.getPrototypeOf(RK4).call(this, A, b, c, h));
  }

  return RK4;
})(RungeKutta);