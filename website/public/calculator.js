import { Calculator } from './calculator-engine.mjs';
const calculator = new Calculator();
const display = document.getElementById('display');
const mode = document.getElementById('code-mode');
const message = document.getElementById('calc-message');
let opening = false;
function render() {
  display.textContent = calculator.display;
  display.scrollLeft = display.scrollWidth;
  mode.setAttribute('aria-checked', String(calculator.codeMode));
  document.getElementById('screen-mode').textContent = calculator.codeMode ? 'CODE MODE' : 'CALCULATOR';
  message.textContent = calculator.error || (calculator.codeMode ? 'Code Mode is on' : 'Ready to calculate');
  message.classList.toggle('error', Boolean(calculator.error));
}
function press(key) {
  if (opening) return;
  const unlock = calculator.press(key);
  render();
  if (unlock) { opening = true; message.textContent = 'Opening workspace…'; location.assign('/workspace.html'); }
}
document.querySelectorAll('[data-key]').forEach(button => button.addEventListener('click', () => press(button.dataset.key)));
mode.addEventListener('click', () => { calculator.setCodeMode(!calculator.codeMode); render(); });
document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  if (event.target.closest('a, input, textarea, select') || event.target.isContentEditable) return;
  // Keep the switch keyboard-accessible; Enter elsewhere calculates the result.
  if (event.target === mode && ['Enter', ' '].includes(event.key)) return;
  const key = { Enter: '=', Escape: 'C', Delete: 'C', c: 'C', C: 'C', r: 'sqrt', R: 'sqrt' }[event.key] || event.key;
  if (/^[\d.+*/=()-]$/.test(key) || ['C', 'Backspace', 'sqrt'].includes(key)) { event.preventDefault(); press(key); }
});
window.addEventListener('pageshow', () => { opening = false; calculator.setCodeMode(false); render(); });
render();
