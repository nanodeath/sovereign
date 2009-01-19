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
    method: 'get'
  });
  $.getJSON('/_logged_in', {
    province: province
  });
  $.getJSON('/province/header', {
    province: province
  });
}

$(function(){
  $.getJSON("/login_status");
})
