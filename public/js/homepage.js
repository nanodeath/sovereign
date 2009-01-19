var submitted_login;
var submitted_password;
var login = null;
var province = null;

PageManager.page(new Page('homepage', {}, {
  login_status: function(json){
    login = login || json.user_username;

    if(json.user_id){
      console.info("you are logged in");
      if(json.province){
        province = json.province;
        loadProvince();
      } else {
        province = null;
        loadKingdom();
      }

    } else {
      console.info('you are not logged in');
      $.getJSON('/_login');
    }
  }
}))