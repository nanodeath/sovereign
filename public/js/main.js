$(function(){
  var submitted_login;
  var submitted_password;
  var login = null;
  var province = null;

  
  function loadKingdom(page){
    if (!page) page = 'your';
    $("#canvas").load("/kingdom/" + page);

    PageManager.triggerPage('signed_in_header');
  }

  function loadProvince(page){
    if (!page) page = 'summary';
    $.ajax({
      url: "/province/" + page,
      data: {
        province: province
      },
      method: 'get',
      dataType: 'json',
      success: function(response){
      //        $("#canvas").html(response);
      //        PageManager.triggerPage('province_' + page, response);

      //        PageManager.triggerPage('signed_in_header');
      }
    });
  }

  var PageManager = new (function(){
    var pm = this;
    var boundOperations = new Object;

    this.bindOperation = function(operation, status, callback){
      if(!boundOperations[operation]){
        boundOperations[operation] = new Object;
      }
      boundOperations[operation][status] = true;
      $(pm).bind('operation_' + operation + '_' + status, callback);
    }

    this.isOperationBound = function(operation, status){
      return boundOperations[operation] && boundOperations[operation][status] === true;
    }

    this.triggerOperation = function(operation, status, data){
      $(pm).trigger('operation_' + operation + '_' + status, data);
      if(this.isOperationBound(operation, status)){
        console.info("Operation triggered: " + operation + ', ' + status);
      } else {
        console.error("Operation NOT triggered: " + operation + ', ' + status);
        console.log(status);
      }
    }


    var boundPages = new Object;
    this.bindPage = function(page, callback){
      boundPages[page] = true;
      $(pm).bind('page_'+page, callback);
    }
    this.isPageBound = function(page){
      return boundPages[page] === true;
    }

    this.triggerPage = function(page, data){
      $(pm).trigger('page_' + page, data);
      if(this.isPageBound(page)){
        console.info("Page triggered: " + page);
      } else {
        console.error("Page NOT triggered: " + page);
      }
    }
  });

  PageManager.bindPage('province_people', function(event, json){
    $("#canvas").html(json.html);
  });
  
  PageManager.bindPage('province_land', function(event, json){
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
            clone = ui.draggable.clone();
            clone.insertAfter(ui.draggable)
            .css({
              position: "absolute",
              left: ui.position.left,
              top: ui.position.top
            });
            var anim = {
              left: position.left,
              top: position.top
            };

            console.log(clone)
            //            clone = $("<div>").css({
            //              position: "absolute",
            //              left: ui.position.left,
            //              top: ui.position.top
            //            }).append(clone);
            console.log(clone)

            var background = $(ev.target).clone();
            background.insertAfter(ui.draggable).css({
              position: "absolute",
              left: ui.position.left,
              top: ui.position.top
            })

            clone.animate(anim, 1000, function(){
              $(this).hide();
              ui.draggable.clone().appendTo("#build_queue");
            });

            background.animate(anim, 1000, function(){
//              $(this).hide();
//              $(ev.target).clone().appendTo("#build_queue");
            });
          }
        });
      }
    });

    (new Image()).src = 'http://www.google.com/intl/en_ALL/images/logo.gif';
  });

  PageManager.bindPage('province_summary', function(event, json){
    $("#canvas").html(json.html)
  });

  PageManager.bindOperation('add_to_building_queue', 'ok', function(event, response){
    $("div.buildings").html(response.html);
    PageManager.triggerPage('province_land');
  });

  PageManager.bindPage('frontpage', function(){
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
  });

  PageManager.bindPage('signed_in_header', function(){
    $("#sign_out").click(function(){
      $.ajax({
        type: 'POST',
        url: '/session/sign_out',
        dataType: 'json',
        success: function(ret){
          if(ret.status == 'ok'){
            initializePage();
          }
        }
      });
    });

    $("#sign_out_completely").click(function(){
      $.ajax({
        type: 'POST',
        url: '/session',
        dataType: 'json',
        data: {
          '_method': 'DELETE'
        },
        success: function(ret){
          if(ret.status == 'ok'){
            initializePage();
          }
        }
      });
    });
  });

  PageManager.bindOperation('page_loading', 'ok', function(){
    PageManager.triggerPage('signed_in_header');
    PageManager.triggerPage('navigation_links_header');
  });

  PageManager.bindPage('navigation_links_header', function(){
    $("ul.header_links.province a").click(function(){
      page = $(this).attr("rel");
      $.ajax({
        type: 'GET',
        url: '/province/' + page,
        data:  {
          province: province
        },
        dataType: 'json',
        success: function(json){
        //          PageManager.triggerPage("province_" + page, json);
        }
      });
    });
  });

  $(document).ajaxComplete(function(event, xhr, ajaxOptions){
    var setCookie = xhr.getResponseHeader('Set-Cookie');
    if (setCookie != '') {
      document.cookie = setCookie;
    }

    var reattach_all_events = true;

    if(ajaxOptions.dataType == 'json'){
      try{
        json = eval("(" + xhr.responseText + ")");
      } catch (e) {
        json = new Object;
      }

      if(json.reload_page === 'no'){
        reattach_all_events = false;
      }
      if(json.operation){
        if(json.page){
          PageManager.triggerPage(json.page, json);
        }
        PageManager.triggerOperation(json.operation, json.status, json);
        
        reattach_all_events = false;
      }
    }

    if(!reattach_all_events) {
      return;
    }
    
  });

  function initializePage(){
    $.getJSON("/login_status", function(ret){
      login = login || ret.user_username;

      if(ret.user_id){
        console.info("you are logged in");
        if(ret.province){
          province = ret.province;
          loadProvince();
        } else {
          province = null;
          loadKingdom();
        }

      } else {
        console.info('you are not logged in');
        $.getJSON('/_login', function(json){
          $("#canvas").html(json.html)
          PageManager.triggerPage('frontpage');
        });
      }
    });
  }

  initializePage();
});
