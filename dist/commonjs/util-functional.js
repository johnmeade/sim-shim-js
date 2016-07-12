'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.add = add;
exports.zip = zip;
exports.push = push;
exports.sorted = sorted;
exports.rest = rest;
function add(x1, x2) {
  return x1 + x2;
}

function zip(x1, x2) {
  if (x1.length != x2.length) throw 'zip: lists not same length';else return zipRec(x1, x2, []);
}

function zipRec(x1, x2, zipped) {
  if (x1.length == 0) return zipped;else return zipRec(rest(x1), rest(x2), push([x1[0], x2[0]], zipped));
}

function push(x, xs) {
  xs.push(x);
  return xs;
}

function sorted(list, fn) {
  list.sort(fn); // undefined is fine as arg
  return list;
}

function rest(list) {
  return list.splice(1);
}