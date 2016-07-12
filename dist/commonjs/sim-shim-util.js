'use strict';

var _rungeKutta = require('./runge-kutta');

var RKStuff = _interopRequireWildcard(_rungeKutta);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

window.SimShimUtil = RKStuff;