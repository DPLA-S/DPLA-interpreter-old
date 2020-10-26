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
    return scope.getSymbol(this.name);
  }
}
class DPLA_Assignment {
  constructor(symbol, value) {
    this.symbol = symbol;
    this.value = value;
  }
  evaluate(scope) {
    scope.setSymbol(this.symbol.name, this.value.evaluate(scope));
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
class DPLAString {
  constructor(str) {
    this.value = str;
  }
  evaluate(scope) {
    return String(this.value);
  }
}
class BinOp {
  constructor(type, arg1, arg2) {
    this.type = type;
    this.arg1 = arg1;
    this.arg2 = arg2;
  }
  evaluate(scope) {
    const arg1 = this.arg1.evaluate(scope);
    const arg2 = this.arg2.evaluate(scope);
    switch (this.type) {
      case '+': return new DPLANumber(arg1 + arg2).evaluate(scope);
      case '-': return new DPLANumber(arg1 - arg2).evaluate(scope);
      case '*': return new DPLANumber(arg1 * arg2).evaluate(scope);
      case '/': return new DPLANumber(arg1 / arg2).evaluate(scope);
      case '^': return new DPLANumber(arg1 ** arg2).evaluate(scope);
      case '%': return new DPLANumber(arg1 % arg2).evaluate(scope);
    }
  }
}
class DPLAFunction {
  constructor(symbol, args) {
    this.symbol = symbol;
    this.args = args;
  }
  evaluate(scope) {
    const func = scope.getSymbol(this.symbol.name);
    if (!func) {
      throw new Error("DPLA Error: No such function \"" + this.symbol.name + "\" ");
      return;
    } else {
      const args = this.args.map(item => item.evaluate(scope));
      return func.apply(null, args);
    }
  }
}

const semantics = grammar.createSemantics();
semantics.addOperation('toAST',{
  number: (a) => new DPLANumber(a.sourceEvaluate()),
  string: (_,a,$) => new DPLAString(a.sourceString),
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
GlobalScope.setSymbol('print', function() {
  console.log(Array.from(arguments).join(' '));
});
GlobalScope.setSymbol('max', (a,b,c) => {
  const result = Math.max(a,b,c);
  if (result === -Infinity) {
    return null;
  } else {
    return result;
  }
});

function runDPLAInCurrentContext(code, printReturn) {
  printReturn = printReturn || false;
  const match = grammar.match(code);
  if (match.succeeded()) {
    const result = semantics(match).toAST().evaluate(GlobalScope);
    if (printReturn) {
      console.log("\x1b[32m=> " + result);
    }
  } else { 
    throw new Error('DPLA Syntax error: \n ' + match.message);
  }
}
runDPLAInCurrentContext('print["Hello World"]');

