export function tabDocument() {
  const nodes=[],elements=new Map();let document;
  function createElement(tagName) {
    const classes=new Set(),attributes=new Map();
    const node={tagName:tagName.toUpperCase(),id:'',hidden:false,value:'',textContent:'',children:[],listeners:new Map(),removed:false,
      classList:{add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n)),contains:n=>classes.has(n),toggle(n,state){const next=state??!classes.has(n);next?classes.add(n):classes.delete(n);return next;}},
      get className(){return [...classes].join(' ')},set className(value){classes.clear();String(value).split(' ').filter(Boolean).forEach(n=>classes.add(n));},
      addEventListener(name,callback){this.listeners.set(name,callback)},
      setAttribute(name,value){attributes.set(name,String(value))},getAttribute:name=>attributes.get(name)??null,
      append(...children){for(const child of children){child.parent=this;child.removed=false;this.children.push(child);}},
      replaceChildren(...children){for(const child of [...this.children])child.remove();this.children=[];this.append(...children);},
      remove(){this.removed=true;for(const child of [...this.children])child.remove();if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);this.parent=null;},
      focus(){document.activeElement=this},select(){},
    };nodes.push(node);return node;
  }
  const body=createElement('body');
  const element=id=>{if(!elements.has(id)){const node=createElement('div');node.id=id;elements.set(id,node);body.append(node);}return elements.get(id);};
  document={body,activeElement:null,createElement,getElementById:id=>[...nodes].reverse().find(node=>!node.removed && node.id===id)||null,querySelectorAll:()=>[],addEventListener(){}};
  element('browser-pages').append(element('web-frame'));
  return {document,element,elements};
}
