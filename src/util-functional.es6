export function add(x1,x2) {
  return x1 + x2;
}

export function zip(x1,x2) {
  if (x1.length != x2.length)
    throw 'zip: lists not same length';
  else return zipRec(x1,x2,[]);
}

function zipRec(x1,x2,zipped) {
  if (x1.length == 0) return zipped;
  else return zipRec( rest(x1), rest(x2), push([x1[0],x2[0]], zipped) );
}

export function push(x,xs) {
  xs.push(x);
  return xs;
}

export function sorted(list, fn) {
  list.sort(fn); // undefined is fine as arg
  return list;
}

export function rest(list) {
  return list.splice(1);
}
