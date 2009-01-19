PageManager.page(new Page('partial', {}, {
  logged_in: function(json){
    $("#logged_in").html(json.html);
    $("#sign_out").click(function(){
      $.ajax({
        type: 'POST',
        url: '/session/sign_out',
        dataType: 'json',
        success: function(ret){
          $.getJSON('/login_status');
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
          $.getJSON('/login_status');
        }
      });
    });
  },
  login: function(){
    $("#menu_bar,#logged_in,#canvas").empty();
    $("#canvas").html(json.html);

    $("#register_form").ajaxForm({
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
}));