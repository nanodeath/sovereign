var PageManager = new (function(){
  var pm = this;
  var boundOperations = new Object;
  
  console = console || {
    log: function(){},
    error: function(){},
    info: function(){}
  }

  var pages = new Object;

  this.page = function(page){
    pages[page.name] = page.operations;
  }

  this.pageBound = function(page_name){
    return !!pages[page_name];
  }

  this.operationBound = function(page_name, operation_name){
    return pageBound(page_name) && pages[page_name][operation_name];
  }

  this.triggerPage = function(page_name, data){
    if(pageBound(page_name) && pages[page_name]['page'] instanceof Function){
      pages[page_name]['page'](data);
    }
  }

  this.triggerOperation = function(page_name, operation_name, data){
    if(operationBound(page_name, operation_name)
      && pages[page_name][operation_name] instanceof Function){
      pages[page_name][operation_name](data);
    }
  }

  $(document).ajaxComplete(function(event, xhr, ajaxOptions){
    var setCookie = xhr.getResponseHeader('Set-Cookie');
    if (setCookie != '') {
      document.cookie = setCookie;
    }

    if(ajaxOptions.dataType == 'json'){
      try{
        json = eval("(" + xhr.responseText + ")");
      } catch (e) {
        json = new Object;
      }

      if(json.page){
        PageManager.triggerPage(json.page);

        if(json.operation){
          PageManager.triggerOperation(json.page, json.operation, json);
        }
      }
    }
  });
});



var Page = function(name, operations){
  this.name = name;
  this.operations = operations;
};

PageManager.page(new Page('province', {
  before: function(){

  },
  after: function(){

  },
  around: function(){

  },
  header: function(data){
    console.log(data)
  },
  page: function(){

  }
}));