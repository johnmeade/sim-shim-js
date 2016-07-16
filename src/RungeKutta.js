import {zip} from 'UtilFunctional';

class RungeKutta {

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

  constructor (A, b, c, h) {
    this.A = A;
    this.b = b;
    this.c = c;
    this.h = h;
    this.n = A.length;
  }

  // compute one step. supplied f must have signature f(t,vector)
  step (f,t,y) {
    ks = [];
    for (var i = 0; i < this.n; i++) {
      let ti = t + this.c[i] * this.h,
          yi = y + this.h * ks.reduce( (acc,ki,j)=>{
            return acc + this.A[i][j] * ki;
          }, 0);
      ks.push( f(ti,yi) );
    }
    return y + h * zip(this.b,ks).reduce((acc,tup)=>{
      return acc + tup[0]*tup[1];
    },0);
  }

  // checks the condition for a consistent RK method (google it...)
  isConsistent () {
    let bools = this.a.reduce( (vec,row,i)=>{
      let rowsum = row.reduce( (sum,aij,j)=>{
        if (j < i) return sum + aij;
        else return sum;
      }, 0 );
      vec.push( c[i] == rowsum );
    }, [] );
    return bools.reduce( (acc,bool)=>{ return acc && bool }, true )
  }

}

class RK4 extends RungeKutta {

  // The classic Runge-Kutta 4 method

  constructor (h) {
    A = [
      [0,   0,   0, 0],
      [0.5, 0,   0, 0],
      [0,   0.5, 0, 0],
      [0,   0,   1, 0]
    ];
    b = [1/6, 1/3, 1/3, 1/6];
    c = [0, 0.5, 0.5, 1];
    super(A,b,c,h);
  }

}
