export class TabStore {
  constructor(limit=12) { this.limit=limit;this.tabs=[];this.activeId=null;this.sequence=0; }
  get active() { return this.tabs.find(tab=>tab.id===this.activeId) || null; }
  add(values={}) {
    if(this.tabs.length>=this.limit)throw new Error(`You can keep up to ${this.limit} website tabs open. Close a tab before opening another.`);
    const tab={...values,id:'site-tab-'+(++this.sequence),url:values.url || '',title:values.title || 'New tab',warning:'',status:'',timer:null,frame:null,closed:false};
    this.tabs.push(tab);this.activeId=tab.id;return tab;
  }
  select(id) { const tab=this.tabs.find(tab=>tab.id===id);if(!tab)return null;this.activeId=id;return tab; }
  close(id) {
    const index=this.tabs.findIndex(tab=>tab.id===id);if(index<0)return null;
    const [tab]=this.tabs.splice(index,1);tab.closed=true;
    if(this.activeId===id)this.activeId=this.tabs[Math.min(index,this.tabs.length-1)]?.id || null;
    return tab;
  }
}
export function createBrowserTabs({document,firstElement,container,list,addButton,onSelect,onClose,onLimit}) {
  const store=new TabStore();
  function render() {
    const focused=document.activeElement?.id;
    list.replaceChildren(...store.tabs.map((tab,index)=>{
      const item=document.createElement('div');item.className='site-tab-item';
      const button=document.createElement('button');button.type='button';button.id=tab.id;button.className='site-tab';button.setAttribute('role','tab');
      button.setAttribute('aria-selected',String(tab===store.active));button.setAttribute('aria-controls',tab.element.id);button.tabIndex=tab===store.active?0:-1;
      button.textContent=tab.title || 'New tab';button.title=(tab.url || 'New tab')+' · Tab '+(index+1);
      button.addEventListener('click',()=>select(tab.id));
      button.addEventListener('keydown',event=>{
        let next;
        if(event.key==='ArrowRight')next=(index+1)%store.tabs.length;
        if(event.key==='ArrowLeft')next=(index-1+store.tabs.length)%store.tabs.length;
        if(event.key==='Home')next=0;if(event.key==='End')next=store.tabs.length-1;
        if(next!==undefined){event.preventDefault();select(store.tabs[next].id);document.getElementById(store.activeId)?.focus();}
        if(event.key==='Delete'){event.preventDefault();close(tab.id);document.getElementById(store.activeId)?.focus();}
      });
      const remove=document.createElement('button');remove.type='button';remove.className='site-tab-close';remove.textContent='×';remove.setAttribute('aria-label','Close '+tab.title);remove.title='Close tab';
      remove.addEventListener('click',()=>close(tab.id));item.append(button,remove);return item;
    }));
    for(const tab of store.tabs){
      const active=tab===store.active;tab.element.classList.toggle('inactive-page',!active);tab.element.setAttribute('aria-hidden',String(!active));tab.element.tabIndex=active?0:-1;
    }
    if(focused?.startsWith('site-tab-'))document.getElementById(focused)?.focus();
  }
  function add(values={},existing,notify=true) {
    let tab;try{tab=store.add(values);}catch(error){onLimit(error.message);return null;}
    const element=existing || document.createElement('iframe');
    element.id ||= 'browser-page-'+tab.id;element.classList.add('web-frame');element.title='Website: '+tab.title;
    element.allow='fullscreen; autoplay; encrypted-media; picture-in-picture';element.referrerPolicy='no-referrer';element.setAttribute('role','tabpanel');element.setAttribute('aria-labelledby',tab.id);
    tab.element=element;if(!existing)container.append(element);
    render();if(notify)onSelect(tab,true);return tab;
  }
  function select(id) { const tab=store.select(id);if(tab){render();onSelect(tab,false);}return tab; }
  function close(id) {
    const previous=store.activeId,tab=store.close(id);if(!tab)return;
    onClose(tab);tab.element.src='about:blank';tab.element.remove();
    if(!store.tabs.length)add();else{render();if(previous===id)onSelect(store.active,false);}
  }
  add({},firstElement,false);
  addButton.addEventListener('click',()=>add());
  return {store,add,select,close,render,get active(){return store.active;},get all(){return store.tabs;},update(tab,values){if(!tab.closed){Object.assign(tab,values);tab.element.title='Website: '+tab.title;render();}}};
}
