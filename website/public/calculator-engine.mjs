const numberPattern = /^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
export function evaluateExpression(expression) {
  const text = expression.replace(/\s/g, '');
  if (!text || text.length > 100) throw new Error('Enter a shorter calculation.');
  const tokens = text.match(/(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?|[()+*/-]/gi) || [];
  if (tokens.join('') !== text) throw new Error('Use numbers and calculator operations only.');
  let position = 0;
  function atom() {
    const token = tokens[position++];
    if (token === '+') return atom();
    if (token === '-') return -atom();
    if (token === '(') {
      const value = sum();
      if (tokens[position++] !== ')') throw new Error('Close the parenthesis.');
      return value;
    }
    if (!token || !numberPattern.test(token)) throw new Error('Complete the calculation first.');
    return Number(token);
  }
  function product() {
    let value = atom();
    while (tokens[position] === '*' || tokens[position] === '/') {
      const operator = tokens[position++];
      const right = atom();
      if (operator === '/' && right === 0) throw new Error('Cannot divide by zero.');
      value = operator === '*' ? value * right : value / right;
    }
    return value;
  }
  function sum() {
    let value = product();
    while (tokens[position] === '+' || tokens[position] === '-') {
      const operator = tokens[position++];
      const right = product();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  }
  const result = sum();
  if (position !== tokens.length) throw new Error('Check the calculation.');
  if (!Number.isFinite(result)) throw new Error('The result is outside the calculator range.');
  return result;
}
export function formatNumber(value) {
  if (!Number.isFinite(value)) throw new Error('The result is outside the calculator range.');
  return String(Number(value.toPrecision(12)));
}

export class Calculator {
  expression = '0';
  error = '';
  evaluated = false;
  codeMode = false;
  codeDigits = '';
  zeros = 0;
  setCodeMode(enabled) { this.codeMode = Boolean(enabled); this.codeDigits = ''; this.zeros = 0; this.error = ''; }
  get display() { return this.codeMode ? this.codeDigits || '0' : this.error ? 'Error' : this.expression.replaceAll('*', '×').replaceAll('/', '÷'); }
  press(key) {
    if (this.codeMode) {
      if (/^\d$/.test(key)) {
        this.codeDigits = (this.codeDigits + key).slice(-12);
        this.zeros = key === '0' ? this.zeros + 1 : 0;
        if (this.zeros === 4) { this.zeros = 0; this.codeDigits = ''; return true; }
      } else {
        this.zeros = 0;
        this.codeDigits = key === 'Backspace' ? this.codeDigits.slice(0, -1) : '';
      }
      return false;
    }
    try {
      if (key === 'C') { this.expression = '0'; this.error = ''; this.evaluated = false; return false; }
      if (this.error) { this.expression = '0'; this.error = ''; this.evaluated = false; }
      if (key === '=' || key === 'sqrt') {
        let value = evaluateExpression(this.expression);
        if (key === 'sqrt') { if (value < 0) throw new Error('Square root requires a non-negative number.'); value = Math.sqrt(value); }
        this.expression = formatNumber(value); this.evaluated = true;
      } else if (key === 'Backspace') {
        this.expression = this.expression.slice(0, -1) || '0'; this.evaluated = false;
      } else if (/^\d$/.test(key)) {
        if (this.evaluated) this.expression = '0';
        this.evaluated = false;
        if (/(^|[+*/(-])0$/.test(this.expression)) this.expression = this.expression.slice(0, -1) + key;
        else this.expression += key;
      } else if (key === '.') {
        if (this.evaluated) this.expression = '0';
        this.evaluated = false;
        const operand = this.expression.match(/[\d.]+$/)?.[0] || '';
        if (!operand.includes('.')) this.expression += operand ? '.' : '0.';
      } else if (/^[+*/-]$/.test(key)) {
        this.evaluated = false;
        if (/[+*/-]$/.test(this.expression) && key !== '-') this.expression = this.expression.replace(/[+*/-]+$/, key);
        else if (this.expression === '0' && key === '-') this.expression = '-';
        else this.expression += key;
      } else if (key === '(' || key === ')') {
        if (this.evaluated || this.expression === '0') this.expression = '';
        this.evaluated = false;
        if (key === '(' && /[\d)]$/.test(this.expression)) this.expression += '*';
        this.expression += key;
      }
      if (this.expression.length > 80) throw new Error('The calculation is too long. Press C to start again.');
    } catch (error) { this.error = error.message; }
    return false;
  }
}
