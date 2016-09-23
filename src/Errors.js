import Throwable from 'throwable'


export function ParseError(wrapped) {
  Throwable.call(this, wrapped)
  this.name = 'ParseError'
}


export function newParseError (msg) { return new ParseError(Error(msg)) }
