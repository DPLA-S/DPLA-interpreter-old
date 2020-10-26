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
    scope.setSymbol(this.symbol.evaluate(), this.value.evaluate());
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
class DPLAFunction {
  constructor(symbol, args) {
    this.symbol = symbol;
    this.args = args;
  }
  evaluate(scope) {
    try {
      const func = scope.getSymbol(this.symbol.evaluate());
      const args = this.args.map(item => item.evaluate(scope));
      func.apply(null, args);
    } catch (err) {
      throw new Error("DPLA Error: No such function \"" + this.symbol.evaluate() + "\"");
    }
  }
}

const semantics = grammar.createSemantics();
semantics.addOperation('toAST',{
  number: (a) => new DPLANumber(a.sourceEvaluate()),
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
  Assignment: (a,_,b) => new DPLA_Assignment(a.toAST(), b.toAST()),
  'Function': (name,_,args,$) => new DPLAFunction(name.toAST(), args.toAST()),
  Arguments: a => a.asIteration().toAST()
});
semantics.addOperation('sourceEvaluate', {
  int: function(a) {
    return parseInt(this.sourceString, 10);
  },
  float: function(a,_,b) {
    return parseFloat(this.sourceString);
  }
});

const GlobalScope = new DPLAScope();
//DPLA function defs
GlobalScope.setSymbol('print', data => {
  console.log(data)
});

function runDPLAInCurrentContext(code) {
  const match = grammar.match(code);
  if (match.succeeded()) {
    const result = semantics(match).toAST().evaluate(GlobalScope);
    console.log("\x1b[32m=> " + result);
  } else { 
    throw new Error('DPLA Syntax error: \n ' + match.message);
  }
}
const code = 'print[10 + 10 * 10]';
runDPLAInCurrentContext(code);
