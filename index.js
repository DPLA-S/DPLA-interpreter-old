"use strict";
const ohm = require('ohm-js');
const fs = require('fs');
const grammar = ohm.grammar(fs.readFileSync('grammar.ohm').toString());

class DPLAScope {
  constructor() {
    this.store = {};
  }
  getSymbol(name) {
    return this.store[name];
  }
  setSymbol(symbol, val) {
    this.store[symbol] = val;
  }
}
class DPLASymbol {
  constructor(name) {
    this.name = name;
  }
  evaluate(scope) {
    return this.name;
  }
}
class DPLA_Assignment {
  constructor(symbol, value) {
    this.symbol = symbol;
    this.value = value;
  }
  evaluate(scope) {
    scope.setSymbol(this.symbol, this.value.evaluate());
  }
}
class DPLANumber {
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
    const arg1 = this.arg1.evaluate();
    const arg2 = this.arg2.evaluate();
    switch (this.type) {
      case '+': return new DPLANumber(arg1 + arg2).evaluate();
      case '-': return new DPLANumber(arg1 - arg2).evaluate();
      case '*': return new DPLANumber(arg1 * arg2).evaluate();
      case '/': return new DPLANumber(arg1 / arg2).evaluate();
      case '^': return new DPLANumber(arg1 ** arg2).evaluate();
      case '%': return new DPLANumber(arg1 % arg2).evaluate();
    }
  }
}

const semantics = grammar.createSemantics();
semantics.addOperation('toAST',{
  number: (a) => new DPLANumber(a.evaluate()),
  AddExpr_plus: (a,_,b) => new BinOp('+', a.toAST(), b.toAST()),
  AddExpr_minus: (a,_,b) => new BinOp('-', a.toAST(), b.toAST()),
  MulExpr_times: (a,_,b) => new BinOp('*', a.toAST(), b.toAST()),
  MulExpr_divide: (a,_,b) => new BinOp('/', a.toAST(), b.toAST()),
  MulExpr_modulus: (a,_,b) => new BinOp('%', a.toAST(), b.toAST()),
  MulExpr_power: (a,_,b) => new BinOp('^', a.toAST(), b.toAST()),
  PriExpr_paren: (_,a,$) => a.toAST(),
  symbol: function(a,_) {
    return new DPLASymbol(this.sourceString);
  },
  Assignment: (a,_,b) => new DPLA_Assignment(a.toAST(), b.toAST())
});
semantics.addOperation('evaluate', {
  int: function(a) {
    return parseInt(this.sourceString, 10);
  },
  float: function(a,_,b) {
    return parseFloat(this.sourceString);
  }
});
const GlobalScope = new DPLAScope();
const code = '1 + 1';
const match = grammar.match(code);

if (match.succeeded()) {
  const result = semantics(match).toAST().evaluate();
  console.log("\x1b[32m=> " + result);
} else { 
  console.log('Match error: \n ' + match.message);
}
