'use strict';

var dbgTrees = true;
var dbgExpr = true;
var dbgSummary = true;
var dbgSkip1 = false;
var dbgSkip2 = false;
var dbgSkip3 = false;

var picks = [ 1, 2, 3, 4, 5, 6 ];

// Generates a random integer in [0, max-1].
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

// Initializes a random set of playing cards on the Krypto game page.
function initGame() {
    var a = [ 1, 2, 3, 4, 5, 6 ],
        b = [ 7, 8, 9, 10 ],
        c = [ 11, 12, 13, 14, 15, 16, 17 ],
        d = [ 18, 19, 20, 21, 22, 23, 24, 25 ];
    var values = a.concat(a, a, b, b, b, b, c, c, d);
    for (var i = 1; i < 7; i++) {
        var n = getRandomInt(values.length),
	    v = values.splice(n, 1)[0],
            c = document.getElementById('c'+i);
        c.innerHTML = v;
	picks[i-1] = v;
    }
}

// Generates all permutations of arr using Heap's iterative algorithm.
// Sedgewick, R. "Permutation Generation Methods". ACM Computing Surveys 9(2), 1977.
// https://dl.acm.org/doi/10.1145/356689.356692
// https://en.wikipedia.org/wiki/Heap%27s_algorithm
function permutations(arr) {
  var l = arr.length,
      r = [arr.slice()],
      c = new Array(l).fill(0),
      i = 1, k, p;

  while (i < l) {
    if (c[i] < i) {
      k = i % 2 && c[i];
      p = arr[i];
      arr[i] = arr[k];
      arr[k] = p;
      ++c[i];
      i = 1;
      r.push(arr.slice());
    } else {
      c[i] = 0;
      ++i;
    }
  }
  return r;
}

// Generates all structurally distinct arithmetic expression trees
// containing the four arithmetic operators and n operands, modulo
// commutativity (for commutative operators, only one of the two
// equivalent expression trees is returned) and operand values
// (operands are denoted by a placeholder token).
//
// The return value is an array of RPN strings containing the operator
// characters and 'x' to denote operands.
var comm = ['+', '*'], noncomm = ['-', '/'];
function trees(n) {
    if (n == 1) {
	return ['x'];
    }
    var res = [];
    var treeSeen = new Set(); // Set of previously seen subtrees (for commutativity).
    for (var i = 1; i < n; i++) {
	var tl = trees(i), tr = trees(n-i);
	for (var r of tr) {
	    for (var l of tl) {
		for (var op of comm) {
		    if (treeSeen.has(r + l + op)) {
			// Eliminate duplicate commutative operations.
			if (dbgSkip1) {
			    console.log("Skipping @1 '" + [l, r, op].join(":") +
					"' because '" + [r, l, op].join(":") + "' exists");
			}
			continue;
		    }
		    var e = l + r + op;
		    res.push(e);
		    treeSeen.add(e);
		}
		for (var op of noncomm) {
		    res.push(l + r + op);
		}
	    }
	}
    }
    return res;
}

// Given an RPN arithmetic expression tree t and an array of integers
// a, replaces the operand placeholders in t, in order, with the
// values in a, and evaluates the corresponding expression. If any of
// the intermediate results is negative or non-integer, immediately
// returns -1.
function treeEval(t, a) {
    var s = [], i = 0;
    for (var e of t) {
	if (e == 'x') {
	    s.push(a[i++]);
	} else {
	    var y = s.pop(), x = s.pop(), r = -1;
	    switch (e) {
	    case '+': r = x+y; break;
	    case '-':
		// Omit x-0, since we generate x+0.
		if (y > 0) { r = x-y; }
		break;
	    case '*': r = x*y; break;
	    case '/':
		// Omit x/1, since we generate x*1.
		if (y > 1 && x % y == 0) { r = x/y; }
		break;
	    }
	    if (r < 0) {
		return -1;
	    }
	    s.push(r);
	}
    }
    return s.pop()
}

// Pretty-prints the RPN expression t applied to the array of integers
// a, as defined for treeEval() above, converting from RPN to a
// series of in-order binary operations with intermediate results.
var exprSeen;
var sb = '<span class="cc">', se = '</span>';
function treePrint(t, a) {
    var evalStk = [], dupStk = [], i = 0, res = "";
    for (var e of t) {
	if (e == 'x') {
	    evalStk.push(a[i]);
	    dupStk.push(a[i]);
	    ++i;
	} else {
	    var y = evalStk.pop(), x = evalStk.pop(), r;
	    var dy = dupStk.pop(), dx = dupStk.pop();
	    switch (e) {
	    case '+': r = x+y; break;
	    case '-': r = x-y; break;
	    case '*': r = x*y; break;
	    case '/': r = x/y; break;
	    }
	    var expr;
	    if (e == '+' || e == '*') {
		expr = [dy, dx, e].join(';');
		if (exprSeen.has(expr)) {
		    if (dbgSkip2) {
			console.log("Skipping @2 because " + expr + " exists");
		    }
		    return '';
		}
	    }
	    evalStk.push(r);
	    expr = [dx, dy, e].join(';');
	    dupStk.push(expr);
	    exprSeen.add(expr);
	    res += x + e + y + "=" + r + ";";
	}
    }
    if (dbgExpr) {
	console.log("Applied " + t + " to " + a + " to obtain " + dupStk.pop() + " / " + res);
    }
    return res;
}

// Given a set of integers nums and a target value goal, produces an
// array of all the arithmetic operations (modulo commutative
// duplicates) that use each integer exactly once to produce goal.
function solve(nums, goal) {
    exprSeen = new Set();
    var opsSeen = new Set(), ans = [];
    var tt = trees(nums.length);
    if (dbgTrees) {
	console.log(tt);
    }
    var nGoal = 0;
    for (var t of tt) {
	for (var a of permutations(nums)) {
	    var n = treeEval(t, a);
	    if (n == goal) {
		++nGoal;
		var p = treePrint(t, a);
		if (p == "" || opsSeen.has(p)) {
		    // More duplicate elimination. Expression trees
		    // are distinct at this point, but two trees may result in the
		    // same series of operations given a different permutation
		    // of inputs. Example:
		    // RPN tree xxxx-/- applied to [4,2,3,1] and
		    // RPN tree xxx-x/- applied to [4,3,1,2] both
		    // result in operations 3-1=2, 2/2=1, 4-1=3.
		    if (dbgSkip3) {
			console.log("Skipping @3 for " + p);
		    }
		    continue;
		}
		opsSeen.add(p);
		ans.push(p);
	    }
	}
    }
    if (dbgSummary) {
	console.log("Trees satisfying objective: " + nGoal);
	console.log("After duplicate elimination : " + ans.length);
    }
    return ans;
}

// Populates the 'answers' div of the Krypto game page with solutions.
function showSolutions(solutions) {
    var ansdiv = document.getElementById('ansdiv');
    if (solutions.length == 0) {
	ansdiv.innerHTML = "There are no solutions!"
    } else {
	var anstab = document.getElementById('anstab');
	anstab.innerHTML = "";
	solutions.sort();
	for (var sol of solutions) {
	    var terms = sol.split(';');
	    terms.pop();
	    var row = anstab.insertRow(-1);
	    for (var term of terms) {
		var cell = row.insertCell(-1);
		cell.innerHTML = term;
	    }
	}
	anstab.style.display = 'table';
    }
    ansdiv.style.display = 'block';
}

function showAnswers() {
    showSolutions(solve(picks.slice(0, picks.length-1), picks[picks.length-1]));
}

function showError(msg) {
    var box = document.getElementById('error');
    box.innerHTML = msg;
    box.style.display = 'block';
}
function hideError() {
    var box = document.getElementById('error');
    box.style.display = 'none';
}

var reCards = /^\s*\d+\s+\d+[\d\s]*$/,
    reObj = /\d+/,
    reSplit = /\s+/;
function solveGame() {
    var cards = document.getElementById('cards'),
	objective = document.getElementById('objective');
    if (!cards.value.match(reCards)) {
	showError("Please provide 2 to 7 integers for the card values.");
	return;
    }
    if (!objective.value.match(reObj)) {
	showError("Please provide an integer for the objective.");
	return;
    }
    var cvals = cards.value.split(reSplit).map(function(n) { return parseInt(n); }),
	oval = parseInt(objective.value);
    if (cvals.length > 7) {
	showError("Too many card values; you'd be waiting a long time!");
	return;
    }
    hideError();
    showSolutions(solve(cvals, oval));
}

function toggleExplanation() {
    var x = document.getElementById("explanation");
    if (x.style.display == 'block') {
	x.style.display = 'none';
    } else {
	x.style.display = 'block';
    }
}
