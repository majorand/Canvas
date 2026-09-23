import test from 'node:test';
import assert from 'node:assert/strict';
import { Calculator, evaluateExpression, formatNumber } from '../public/calculator-engine.mjs';

function enter(calculator, keys) { return [...keys].map(key => calculator.press(key)); }

test('arithmetic precedence, signed operands, parentheses, and scientific results', () => {
  for (const [input, expected] of [['2+3*4', 14], ['(2+3)*4', 20], ['8/4/2', 1], ['2*-3', -6], ['2--3', 5], ['.5+1.25', 1.75], ['1e+12/2', 5e11]]) {
    assert.equal(evaluateExpression(input), expected, input);
  }
  assert.equal(formatNumber(evaluateExpression('0.1+0.2')), '0.3');
  for (const input of ['1/0', '0/0', '(1+2', '2+', '1;alert(1)', '1e999', '2(3)']) assert.throws(() => evaluateExpression(input), input);
});

test('keypad supports decimals, result chaining, correction, square roots, and error recovery', () => {
  const c = new Calculator();
  enter(c, '0.1+0.2='); assert.equal(c.display, '0.3');
  enter(c, '*10='); assert.equal(c.display, '3');
  enter(c, '9'); c.press('sqrt'); assert.equal(c.display, '3');
  enter(c, 'C12'); c.press('Backspace'); enter(c, '5='); assert.equal(c.display, '15');
  enter(c, 'C2*(3+4)='); assert.equal(c.display, '14');
  enter(c, 'C8/0='); assert.equal(c.display, 'Error'); assert.match(c.error, /zero/);
  enter(c, '7+2='); assert.equal(c.display, '9');
  enter(c, 'C-9'); c.press('sqrt'); assert.equal(c.display, 'Error');
  enter(c, 'C1..5+2='); assert.equal(c.display, '3.5');
});

test('four zero presses open the workspace only in Code Mode', () => {
  const c = new Calculator();
  assert.deepEqual(enter(c, '0000'), [false, false, false, false]);
  c.setCodeMode(true);
  assert.deepEqual(enter(c, '000'), [false, false, false]); assert.equal(c.display, '000');
  assert.equal(c.press('0'), true);
  assert.deepEqual(enter(c, '00100'), [false, false, false, false, false]);
  c.press('Backspace');
  assert.deepEqual(enter(c, '0000'), [false, false, false, true]);
  enter(c, '00'); c.setCodeMode(false); c.setCodeMode(true);
  assert.deepEqual(enter(c, '0000'), [false, false, false, true]);
});

test('Code Mode preserves arithmetic and clear resets partial codes', () => {
  const c = new Calculator();
  enter(c, '2+3'); c.setCodeMode(true); enter(c, '000'); c.press('C');
  assert.deepEqual(enter(c, '000'), [false, false, false]);
  c.setCodeMode(false); c.press('='); assert.equal(c.display, '5');
});
