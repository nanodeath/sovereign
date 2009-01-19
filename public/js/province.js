PageManager.page(new Page('province', {}, {
  header: function(json){
    $("#menu_bar").html(json.html);
    $("#menu_bar ul.header_links.province a").click(function(){
      page = $(this).attr("rel");
      $.ajax({
        type: 'GET',
        url: '/province/' + page,
        data:  {
          province: province
        }
      });
    });
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