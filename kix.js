const kix = {};

// TODO :if :for
// TODO template nesting
// TODO template argument

kix.current = {
  // template
  // model
};

const $ = function (selector) {
  return document.querySelector(selector);
}

kix.monitor = function(originModel){
  let model = {}

  for(let key in originModel){
    Object.defineProperty(model, key, {
      get: function() {
        return originModel[key];
      },
      set: function(value) {
        originModel[key] = value;
        kix.calculate();
      },
      enumerable:true
    });
  }

  return model;
}

kix.load = function(templateString){
  let func = new Function('return ('+ templateString + ')');
  let {template,controller} = func();
  let model = kix.monitor(controller);

  return {template,model};
}

kix.router = function(url){
  for (let state of kix.route) {
    const rex = new RegExp('^'+state.url+'$');
    if(rex.test(url)){
      return { url , templateString: state.templateString }
    }
  }
  return { url: kix.route[0].url , templateString: kix.route[0].templateString }
}

kix.calculate = function(){
  let modelKey = [];
  let modelValue = [];
  for(let key in kix.current.model){
    modelKey.push(key);
    modelValue.push(kix.current.model[key]);
  }

  let num = 0;
  kix.current.template.replace(/{{(.*)}}/g,(_,expression) => {
    num = num + 1
    const func = new Function(...modelKey,'return (' + expression + ')');
    const value = func(...modelValue);
    $('#expression' + num).innerHTML = value;
  })
}

kix.render = function(template,model) {
  template = template.replace(/:to="(\/[a-zA-Z0-9-\_]*)"/g,
    (_,path) => 'onclick="kix.go(\''+path+'\')"');
  
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

  kix.calculate();

  for(let name in inputs){
    let input = inputs[name];
    input.element = $('#'+name);
    input.element.value = model[input.model];
    input.handler = ()=>{
      model[input.model] = input.element.value;
    }
    input.element.addEventListener('change',input.handler)
  }

  kix.current.model.inputs = inputs
}

kix.pageEnter = function(){
  if(kix.current.model && kix.current.model.enter){
    kix.current.model.enter();
  }
}

kix.pageExit = function(){
  if(kix.current.model && kix.current.model.inputs){
    for(let name in kix.current.inputs){
      let input = kix.current.inputs[name]
      input.element.removeEventListener('change', input.handler);
    }
  }

  if(kix.current.model && kix.current.model.exit){
    kix.current.model.exit();
  }
}

kix.go = function(url){
  kix.pageExit()
  let nextPage = kix.router(url);
  kix.current = kix.load(nextPage.templateString);
  kix.render(kix.current.template, kix.current.model);
  kix.pageEnter();
  
  window.history.pushState({},'',nextPage.url);
}

window.addEventListener('DOMContentLoaded',event => {
  const rex = /^https?:\/\/[a-zA-Z0-9-\_:\.]+(\/.*)$/;
  const url = rex.exec(window.location.href)[1];
  kix.go(url);
});
