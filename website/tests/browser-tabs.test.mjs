import test from 'node:test';
import assert from 'node:assert/strict';
import { TabStore,createBrowserTabs } from '../public/browser-tabs.mjs';
import { tabDocument } from './fixtures/tab-dom.mjs';

test('tab selection and closing choose an adjacent tab without disturbing background tabs',()=>{
  const store=new TabStore(3),first=store.add(),second=store.add(),third=store.add();
  store.select(second.id);store.close(first.id);assert.equal(store.active,second);
  store.close(second.id);assert.equal(store.active,third);assert.equal(second.closed,true);
  const fourth=store.add();assert.notEqual(fourth.id,second.id);assert.equal(store.select('missing'),null);assert.equal(store.active,fourth);
  store.close(fourth.id);store.close(third.id);assert.equal(store.active,null);
});
test('tab limits reject excess pages and release capacity when a tab closes',()=>{
  const store=new TabStore(2);const one=store.add();store.add();assert.throws(()=>store.add(),/up to 2/);assert.equal(store.tabs.length,2);store.close(one.id);assert.ok(store.add());
});
test('tab UI keeps iframe nodes attached across switches and supports keyboard selection and closing',()=>{
  const {document,element}=tabDocument();let selected,closed;
  const tabs=createBrowserTabs({document,firstElement:element('web-frame'),container:element('browser-pages'),list:element('browser-tabs'),addButton:element('new-tab'),onSelect:tab=>selected=tab,onClose:tab=>closed=tab,onLimit:()=>{}});
  const first=tabs.active,second=tabs.add({title:'<script>unsafe</script>'});
  assert.equal(first.element.removed,false);assert.ok(first.element.classList.contains('inactive-page'));assert.equal(selected,second);
  const firstButton=element('browser-tabs').children[0].children[0];
  firstButton.listeners.get('keydown')({key:'ArrowLeft',preventDefault(){}});assert.equal(tabs.active,second);
  tabs.select(first.id);assert.equal(first.element.removed,false);assert.ok(!first.element.classList.contains('inactive-page'));
  assert.equal(element('browser-tabs').children[1].children[0].textContent,'<script>unsafe</script>');
  element('browser-tabs').children[0].children[0].listeners.get('keydown')({key:'Delete',preventDefault(){}});
  assert.equal(closed,first);assert.equal(first.element.removed,true);assert.equal(tabs.active,second);
});
