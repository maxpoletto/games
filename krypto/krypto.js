'use strict';

var dbgTrees = false, dbgExpr = false, dbgSummary = false,
    dbgSkip1 = false, dbgSkip2 = false, dbgSkip3 = false;

// Generates a random integer in [0, max-1].
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

// Generates all permutations of arr using Heap's iterative algorithm.
// Sedgewick, R. "Permutation Generation Methods".
//    ACM Computing Surveys 9(2), 1977.
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
// values in a, and evaluates the corresponding expression.
//
// If any of the intermediate results is negative or non-integer, or
// if an intermediate term would result in division by 0 or is 'x-0'
// or 'x/1' (trivial variations of 'x+0' and 'x*1'), immediately
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

// Pretty-prints the RPN tree t applied to the array of integers a, as
// defined for treeEval() above, as a series of semicolon-separated
// infix expressions.
//
// Returns an array of two strings: a simple one, and a "formatted"
// one in which the original inputs (the values from a) are formatted
// with an HTML span.
//
// Returns an empty array if the RPN tree contains a commutative
// expression whose commutative version has already been seen (via a
// different permutation of a).
var exprSeen;
var sb = '<span class="cc">', se = '</span>';
function treePrint(t, a) {
    var evalStk = [],		// Implements RPN evaluation.
	exprStk = [],		// Records intermediate terms as
				// strings, for duplicate elimination.
	fmtStk = [],		// Includes format info to distinguish
				// inputs from intermediate results.
	i = 0,			// Pointer into a.
	res = "",		// Result string in infix notation.
	fmtRes = "";		// Formatted result string.
    for (var e of t) {
	if (e == 'x') {
	    evalStk.push(a[i]);
	    exprStk.push(a[i]);
	    fmtStk.push(sb + a[i] + se);
	    ++i;
	} else {
	    var r;
	    var y = evalStk.pop(), x = evalStk.pop();
	    var ey = exprStk.pop(), ex = exprStk.pop();
	    var fy = fmtStk.pop(), fx = fmtStk.pop();
	    switch (e) {
	    case '+': r = x+y; break;
	    case '-': r = x-y; break;
	    case '*': r = x*y; break;
	    case '/': r = x/y; break;
	    }
	    var expr;
	    if (e == '+' || e == '*') {
		expr = [ey, ex, e].join(';');
		if (exprSeen.has(expr)) {
		    if (dbgSkip2) {
			console.log("Skipping @2 because " + expr + " exists");
		    }
		    return [];
		}
	    }
	    expr = [ex, ey, e].join(';');
	    exprStk.push(expr);
	    exprSeen.add(expr);
	    evalStk.push(r);
	    fmtStk.push(r);
	    res += x + e + y + "=" + r + ";";
	    fmtRes += fx + e + fy + "=" + r + ";";
	}
    }
    if (dbgExpr) {
	console.log("Applied " + t + " to " + a + " to obtain " +
		    exprStk.pop() + " / " + res);
    }
    return [res, fmtRes];
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
	    // Evaluate trees separately from printing them to quickly
	    // remove the many that do not evaluate to the goal.
	    var n = treeEval(t, a);
	    if (n == goal) {
		++nGoal;
		var p = treePrint(t, a);
		if (p.length == 0 || opsSeen.has(p[0])) {
                    // More poor man's duplicate elimination.
                    // Expression trees are distinct (commutative
                    // duplicates removed) at this point, but two
                    // non-commutative trees may still result in the
                    // same series of operations given a different
                    // permutation of inputs.
		    //
		    // Example:
                    // RPN tree xxxx-/- applied to [4,2,3,1] and
                    // RPN tree xxx-x/- applied to [4,3,1,2] both
                    // result in operations 3-1=2, 2/2=1, 4-1=3.
		    //
		    // Note: this eliminates expressions that are
		    // identical but differ in which terms are inputs
		    // and which are intermediate results. That seems
		    // ok: it looks better and it's easy enough to
		    // derive the variants.
                    if (dbgSkip3 && p.length > 0) {
			console.log("Skipping @3 for " + p[0]);
                    }
                    continue;
		}
		opsSeen.add(p[0]);
		ans.push(p[1]);
	    }
	}
    }
    if (dbgSummary) {
	console.log("Trees satisfying objective: " + nGoal);
	console.log("After duplicate elimination : " + ans.length);
    }
    return ans;
}

function showNoSolutions() {
    document.getElementById('anstab').style.display = 'none';
    document.getElementById('noans').style.display = 'block';
}

// Populates the 'answers' div of the Krypto game page with solutions.
function showSolutions(solutions) {
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
    document.getElementById('anstab').style.display = 'block';
    document.getElementById('noans').style.display = 'none';
}

function showError(msg) {
    var box = document.getElementById('error');
    box.innerHTML = msg;
    box.style.display = 'block';
}

function hideError() {
    document.getElementById('error').style.display = 'none';
}

function hideExplanation() {
    document.getElementById('explanation').style.display = 'none';
}
function toggleExplanation() {
    var x = document.getElementById("explanation");
    if (x.style.display == 'block') {
	x.style.display = 'none';
    } else {
	x.style.display = 'block';
    }
}

function showAnswer(s) {
    if (s.length == 0) {
	showNoSolutions();
    } else {
	showSolutions(s);
    }
}

function solveCards() {
    showAnswer(solve(picks.slice(0, picks.length-1), picks[picks.length-1]));
}

var reCards = /^\s*\d+\s+\d+[\d\s]*$/,
    reObj = /\d+/,
    reSplit = /\s+/;
function solveInputs() {
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
    hideExplanation();
    showAnswer(solve(cvals, oval));
}

// Initializes a random set of playing cards on the Krypto game page.
var picks = [ 1, 2, 3, 4, 5, 6 ];
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
