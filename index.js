"use strict";
const ohm = require('ohm-js');
const fs = require('fs');
const grammar = ohm.grammar(fs.readFileSync('grammar.ohm').toString());

class DNumber {
  constructor(val) {
    this.val = val;
  }
  evaluate(scope) {
    return this.val;
  }
}

class BinOp {
  constructor(type, arg1, arg2) {
    this.type = type;
    this.arg1 = arg1;
    this.arg2 = arg2;
  }
  evaluate(scope) {
    switch (this.type) {
      case '+': return new DNumber(this.arg1 + this.arg2);
      case '-': return new DNumber(this.arg1 - this.arg2);
      case '*': return new DNumber(this.arg1 * this.arg2);
      case '/': return new DNumber(this.arg1 / this.arg2);
      case '^': return new DNumber(this.arg1 ^ this.arg2);
      case '%': return new DNumber(this.arg1 % this.arg2);
    }
  }
}

const semantics = grammar.createSemantics();
semantics.addOperation('evaluateMatch',{
  int: function(a) {
    return new DNumber(parseInt(this.sourceString, 10));
  }, float: function(a,b,c) {
    return new DNumber(parseFloat(this.sourceString));
  }
});

const code = '42';
const match = grammar.match(code);

if (match.succeeded()) {
  const result = semantics(match).evaluateMatch().evaluate();
  console.log(result);
} else { 
  console.log('Match error: \n ' + match.message);
}
