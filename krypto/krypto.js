'use strict';

var picks = [ 1, 2, 3, 4, 5, 6 ];

// Generates a random integer in [0, max-1].
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

// Initializes a random set of playing cards on the Krypto game page.
function init() {
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
    console.log(picks);
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
var trees_seen; // Set of previously seen subtrees (for commutativity).
var comm = ['+', '*'], noncomm = ['-', '/'];
function trees(n) {
    if (n == 1) {
	return ['x'];
    }
    var res = [];
    for (var i = 1; i < n; i++) {
	var tl = trees(i), tr = trees(n-i);
	for (var r of tr) {
	    for (var l of tl) {
		for (var op of comm) {
		    if (trees_seen.has(r + l + op)) {
			// Eliminate duplicate commutative operations.
			continue;
		    }
		    var e = l + r + op;
		    res.push(e);
		    trees_seen.add(e);
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
function tree_eval(t, a) {
    var s = [], i = 0;
    for (var e of t) {
	if (e == 'x') {
	    s.push(a[i++]);
	} else {
	    var y = s.pop(), x = s.pop(), r = -1;
	    switch (e) {
	    case '+': r = x+y; break
	    case '-': r = x-y; break
	    case '*': r = x*y; break
	    case '/':
		if (y > 0 && x % y == 0) { r = x/y; }
		break
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
// a, as defined for tree_eval() above, converting from RPN to a
// series of in-order binary operations with intermediate results.
function tree_print(t, a) {
    var s = [], i = 0, res = "";
    for (var e of t) {
	if (e == 'x') {
	    s.push(a[i++]);
	} else {
	    var y = s.pop(), x = s.pop(), r;
	    switch (e) {
	    case '+': r = x+y; break
	    case '-': r = x-y; break
	    case '*': r = x*y; break
	    case '/': r = x/y; break;
	    }
	    s.push(r);
	    res += x + e + y + "=" + r + " "
	}
    }
    return res;
}

// Given a set of integers nums and a target value goal, produces an
// array of all the arithmetic operations (modulo commutative
// duplicates) that use each integer exactly once to produce goal.
function solve(nums, goal) {
    trees_seen = new Set();
    var ans_seen = new Set(), ans = [];
    for (var t of trees(nums.length)) {
	for (var a of permutations(nums)) {
	    var n = tree_eval(t, a);
	    if (n == goal) {
		var p = tree_print(t, a);
		if (!ans_seen.has(p)) {
		    // More duplicate elimination. Expression trees
		    // are distinct, but two trees may result in the
		    // same computation given a different permutation
		    // of inputs.
		    ans_seen.add(p);
		    ans.push(p);
		}
	    }
	}
    }
    return ans;
}

// Populates the 'answers' div of the Krypto game page.
function showAnswers() {
    var solutions = solve(picks.slice(0, picks.length-1), picks[picks.length-1]);
    var answers = document.getElementById('answers');
    if (solutions.length == 0) {
	answers.innerHTML = "There are no solutions!"
    } else {
	solutions.sort();
	answers.innerHTML = "";
	for (var sol of solutions) {
	    var item = document.createElement('div');
	    item.innerHTML = sol;
	    answers.appendChild(item);
	}
    }
    answers.style.display = 'block';
}

init();
