#!/usr/bin/env python

import itertools
import string

s = set()
def trees(n):
    if n == 1:
        return ['x']
    res = []
    for split in range(1, n):
        tl, tr = trees(split), trees(n-split)
        for r in tr:
            for l in tl:
                for op in [ '-', '/' ]:
	            res.append(l+r+op)
                for op in [ '+', '*' ]:
                    e = r+l+op
                    if e in s:
                        continue
                    e = l+r+op
                    res.append(e)
                    s.add(e)
    return res

def tree_eval(t, a):
    ai = 0
    s = []
    for i in t:
        if i == 'x':
            s.append(a[ai])
            ai += 1
        else:
            y = s.pop()
            x = s.pop()
            r = -1
            if i == '+':
                r = x+y
            elif i == '-':
                r = x-y
            elif i == '*':
                r = x*y
            elif i == '/' and y > 0 and x % y == 0:
                r = x/y
            if r < 0:
                return -1
            s.append(r)
    return s.pop()

def tree_print(t, a):
    ai = 0
    s = []
    ans = ""
    for i in t:
        if i == 'x':
            s.append(a[ai])
            ai += 1
        else:
            y = s.pop()
            x = s.pop()
            r = -1
            if i == '+':
                r = x+y
            elif i == '-':
                r = x-y
            elif i == '*':
                r = x*y
            elif i == '/':
                r = x/y
            s.append(r)
            ans += str(x) + i + str(y) + "=" + str(r) + " "
    return ans

if __name__ == '__main__':
    d = [1,2,3,4,5]
    ans = 5
    ans_set = set()
    for e in trees(len(d)):
        for a in itertools.permutations(d):
            r = tree_eval(e, a)
            if r == ans:
                p = tree_print(e, a)
                if not p in ans_set:
                    ans_set.add(p)
                    print(p, "|", e, "|", a, "|")
