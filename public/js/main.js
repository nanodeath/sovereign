$(function(){
  var submitted_login;
  var submitted_password;
  var login = null;
  var province = null;
  
  
  function initializePage(){
    $.getJSON("/login_status", function(ret){
      login = login || ret.user_username;
      
      if(ret.user_id){
        console.info("you are logged in");
        if(ret.province){
          province = ret.province;
          loadProvince();
        } else {
          loadKingdom();
        }
        
      } else {
        console.info('you are not logged in');
        $("#canvas").load("/_login");
      }
    })
  }
  initializePage();
  
  function loadKingdom(page){
    if (!page) page = 'your';
    $("#canvas").load("/kingdom/" + page);
  }

  function loadProvince(page){
    if (!page) page = 'summary';
    $.ajax({
      url: "/province/" + page,
      data: {
        province: province
      },
      method: 'get',
      success: function(response){
        $("#canvas").html(response);
      }
    });
  }
  
  $(document).ajaxComplete(function(event, xhr, ajaxOptions){
    var setCookie = xhr.getResponseHeader('Set-Cookie');
    if (setCookie != '') {
      document.cookie = setCookie;
    }
    
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

    $("ul.header_links.province a").click(function(){
      page = $(this).attr("rel");
      $.ajax({
        type: 'GET',
        url: '/province/' + page,
        data:  {
          province: province
        },
        success: function(response){
          $("#canvas").html(response);
        }
      });
    });
  });
});
