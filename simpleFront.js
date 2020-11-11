const simpleFront = {};

// TODO :if :for
// TODO template nesting
// TODO template argument

simpleFront.current = {
  // template
  // model
};

const $ = function (selector) {
  return document.querySelector(selector);
}

simpleFront.monitor = function(originModel){
  let model = {}

  for(let key in originModel){
    Object.defineProperty(model, key, {
      get: function() {
        return originModel[key];
      },
      set: function(value) {
        originModel[key] = value;
        simpleFront.calculate();
      },
      enumerable:true
    });
  }

  return model;
}

simpleFront.load = function(templateString){
  let func = new Function('return ('+ templateString + ')');
  let {template,controller} = func();
  let model = simpleFront.monitor(controller);

  return {template,model};
}

simpleFront.router = function(url){
  for (let state of simpleFront.route) {
    const rex = new RegExp('^'+state.url+'$');
    if(rex.test(url)){
      return { url , templateString: state.templateString }
    }
  }
  return { url: simpleFront.route[0].url , templateString: simpleFront.route[0].templateString }
}

simpleFront.calculate = function(){
  let modelKey = [];
  let modelValue = [];
  for(let key in simpleFront.current.model){
    modelKey.push(key);
    modelValue.push(simpleFront.current.model[key]);
  }

  let num = 0;
  simpleFront.current.template.replace(/{{(.*)}}/g,(_,expression) => {
    num = num + 1
    const func = new Function(...modelKey,'return (' + expression + ')');
    const value = func(...modelValue);
    $('#expression' + num).innerHTML = value;
  })
}

simpleFront.render = function(template,model) {
  template = template.replace(/:to="(\/[a-zA-Z0-9-\_]*)"/g,
    (_,path) => 'onclick="simpleFront.go(\''+path+'\')"');
  
  let num = 0
  template = template.replace(/{{(.*)}}/g,() => {
    num = num + 1;
    return '<div id="expression'+num+'"></div>';
  })

  num = 0;
  let inputs = {};
  template = template.replace(/:model="([a-zA-Z0-9-\_]+)"/,(_,model)=>{
    num = num + 1
    inputs['input'+num] = {model}
    return 'id="input'+num+'"'
  })

  $('body').innerHTML = template;

  simpleFront.calculate();

  for(let name in inputs){
    let input = inputs[name];
    input.element = $('#'+name);
    input.element.value = model[input.model];
    input.handler = ()=>{
      model[input.model] = input.element.value;
    }
    input.element.addEventListener('change',input.handler)
  }

  simpleFront.current.model.inputs = inputs
}

simpleFront.pageEnter = function(){
  if(simpleFront.current.model && simpleFront.current.model.enter){
    simpleFront.current.model.enter();
  }
}

simpleFront.pageExit = function(){
  if(simpleFront.current.model && simpleFront.current.model.inputs){
    for(let name in simpleFront.current.inputs){
      let input = simpleFront.current.inputs[name]
      input.element.removeEventListener('change', input.handler);
    }
  }

  if(simpleFront.current.model && simpleFront.current.model.exit){
    simpleFront.current.model.exit();
  }
}

simpleFront.go = function(url){
  simpleFront.pageExit()
  let nextPage = simpleFront.router(url);
  simpleFront.current = simpleFront.load(nextPage.templateString);
  simpleFront.render(simpleFront.current.template, simpleFront.current.model);
  simpleFront.pageEnter();
  
  window.history.pushState({},'',nextPage.url);
}

window.addEventListener('DOMContentLoaded',event => {
  const rex = /^https?:\/\/[a-zA-Z0-9-\_:\.]+(\/.*)$/;
  const url = rex.exec(window.location.href)[1];
  simpleFront.go(url);
});
