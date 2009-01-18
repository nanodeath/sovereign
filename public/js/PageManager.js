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
    pages[page.name] = $.extend(page.meta, page.operations);
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

      triggerHook(page_name, 'before', data);
      triggerHook(page_name, 'around', data);
      pages[page_name][operation_name](data);
      triggerHook(page_name, 'around', data);
      triggerHook(page_name, 'after', data);
    }
  }

  var triggerHook = function(page_name, hook, data){
    if(pageBound(page_name) && pages[page_name][hook] instanceof Function){
      pages[page_name][hook](data);
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



var Page = function(name, meta, operations){
  this.name = name;
  this.meta = meta;
  this.operations = operations;
};

PageManager.page(new Page('homepage', {
  after: function(){
    $("#register_form").ajaxForm({
      dataType: 'json',
      success: function(response){
        if (response.status == 'ok') {
          $("#register_modal").jqmHide();
          initializePage();
        } else {
          alert("try again");
        }
      }
    });

    $("#login_form").ajaxForm({
      dataType: 'json',
      beforeSubmit: function(){
        submitted_login = $("#login").val();
        submitted_password = $("#password").val();
      },
      success: function(response){
        if (response.status == 'ok') {
          $("#login_form").hide();
          $("#login_message").html("<p>Login successful.</p>").removeClass('failure').addClass('success').show();
          $("#login_form #login").val("");
          setTimeout(function(){
            if(response.province){
              province = response.province;
              loadProvince();
            } else {
              province = null;
              loadKingdom();
            }
          }, 500);
        } else {
          var reason = "";
          switch (response.message) {
            case "no_user_or_password_given":
              reason = $("<p>Please supply username and password</p>");
              break;
            case "invalid_user":
              reason = $("<p>Invalid login.  Can <strong>only</strong> contain letters.</p>");
              break;
            case "user_not_found":
              var link = $("<a href='#'>register</a>");
              link.click(function(){
                $("#register_login").val(submitted_login);
                $("#register_password").val(submitted_password);
                $("#register_modal").jqmShow();
                $("#register_email").focus();
              });
              reason = $("<p>User not found.  Perhaps you'd like to </p>").append(link).append(" it?");
              break;
            case "wrong_password":
              reason = $("<p>Invalid password</p>");
              break;
            default:
              reason = $("<p>Unknown</p>");
          }
          var message = $("<p>Login failed.</p>").append(reason.prepend("Reason: "));
          $("#login_message").html(message).removeClass('success').addClass('failure').slideDown('fast');
        }
      }
    });

    $('#register_modal').jqm();

    if (login && $("#login_form #login").val() == '') {
      $("#login_form #login").val(login);
    }
  }
}, {}))

PageManager.page(new Page('province', {
  before: function(){

  },
  after: function(){

  },
  around: function(){

  },
  page: function(){

  },
  header: function(data){
    console.log(data)
  }
}, {
  header: function(json){
    $("#menu_bar").html(json.html);
  },
  summary: function(json){
    $("#canvas").html(json.html)
  },
  people: function(json){
    $("#canvas").html(json.html);
  },
  land: function(json){
    $("#canvas").html(json.html);
    $(".buildings input[type='button'].add_to_queue").click(function(){
      var data = $(".buildings input[type='text'].add_to_queue").serializeArray();
      $.ajax({
        type: 'POST',
        url: '/province/land/buildings',
        dataType: 'json',
        data: {
          build_queue: data,
          province: province
        },
        success: function(response){
          if(response.operation){
            PageManager.triggerOperation(response.operation, response.status, response);
          }
        }
      });
    });
    $("#build_queue").sortable();

    $("div.buildings img.building_image").each(function(){

      // Add data to the construction targets about buildings that can be built
      // on them
      var build_targets = $(this).attr("can_be_built_on").split(',');
      var construction_targets = $(".construction_targets");
      for(var i = 0, len = build_targets.length; i < len; i++){
        var target = construction_targets.find("img[building="+build_targets[i]+"]");
        var current = target.attr("buildable");

        current = current ? current.split(',') : [];

        var b = $(this).attr("building");
        if(b){
          current.push(b);
          target.attr("buildable", current);
        }
      }

      $(this).draggable({
        revert: 'invalid',
        start: function(){
          $("div.construction_targets").addClass('drag_in_process');
          console.log($(this));
        },
        stop: function(){
          $("div.construction_targets").removeClass('drag_in_process');
        },
        helper: function(){
          return $(this).clone();
        },
        opacity: '0.5'
      });
    });

    $("div.construction_targets img.building_image").each(function(){
      var buildable = $(this).attr('buildable');
      if(buildable){
        buildable = buildable.split(',');
        var buildable_arr = [];
        for(var i = 0, len = buildable.length; i < len; i++){
          buildable_arr.push("div.buildings [building=" + buildable[i] + "]");
        }
        buildable = buildable_arr.join(',');
        console.info("buildable for " + $(this).attr("building") + " is ")
        console.info($(buildable));
        $(this).droppable({
          accept: buildable,
          activeClass: 'available_build_target',
          hoverClass: 'current_target_valid',
          drop: function(ev, ui){
            console.log('dropped');
            //            console.log(ev.target)
            //            console.log(ui);
            var clone = ui.draggable.clone();
            $("#build_queue").append(clone);
            var position = clone.position();
            clone.remove();
            var anim = {
              left: position.left,
              top: position.top
            };
            var bImage = $(ev.target).attr("src");

            cloneDiv = $("<div />").css({
              width: 64,
              height: 64,
              position: 'absolute',
              left: ui.position.left,
              top: ui.position.top,
              "background-image": "url(" + bImage + ")",
              display: 'inline-block'
            }).append(ui.draggable.clone())
            .insertAfter(ui.draggable)
            .animate(anim, 1000, function(){
              cloneDiv.appendTo("#build_queue");
              cloneDiv.css({
                position: "",
                left: "",
                top: ""
              });
            });
          }
        });
      }
    });
  },
  add_to_building_queue: function(json){
    $("div.buildings").html(json.html);
  //    PageManager.triggerPage('province_land');
  }
}));