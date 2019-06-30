function makeDraggable(evt) {
  var selectedElement = false;
  var allow_x, allow_y;
  var x_atr;
  var y_atr;
  var mouse_start_x, mouse_start_y;
  var attr_x,attr_y,attr_height;
  var svg = evt.target;
  var element_type;
  var extra_info;
  svg.addEventListener('mousedown', startDrag);
  svg.addEventListener('mousemove', drag);
  svg.addEventListener('mouseup', endDrag);
  svg.addEventListener('mouseleave', endDrag);
  function startDrag(evt) {
    //only start drag if a different drag isn't in progress
    if(!selectedElement) {
      if (evt.target.classList.contains('draggable')) {
        selectedElement = evt.target;
        attr_height = (parseFloat(selectedElement.getAttribute("height")));
        mouse_start_x = evt.clientX;
        mouse_start_y = evt.clientY;
        extra_info = evt.target.id.split('_');
        x_atr="x";
        y_atr="y";

        if (evt.target.classList.contains('svg_resize')) {
          allow_x = false;
          allow_y = true;
          element_type="svg_resize";
        } else if (evt.target.classList.contains('ann_resize')) {
          allow_x = false;
          allow_y = true;
          element_type="ann_resize";
          draw_control_panel("annotation_" +  extra_info[1]);
        } else if (evt.target.classList.contains('arrow_drag')) {
          selectedElement.setAttribute("style","stroke-opacity:1");
          x_atr="cx";
          y_atr="cy";
          allow_x = true;
          allow_y = true;
          element_type="arrow_drag";
          var elements = document.querySelectorAll('.grip');
          for(var i=0; i<elements.length; i++){
              elements[i].style.display = 'block';
          }
          draw_control_panel("arrow_" +  extra_info[1]);
        }

        attr_x = parseFloat(selectedElement.getAttribute(x_atr));
        attr_y = parseFloat(selectedElement.getAttribute(y_atr));
      }
    }
  }
  function drag(evt) {
    if (selectedElement) {
      evt.preventDefault();
      if (allow_x) {
        var new_x = attr_x + evt.clientX - mouse_start_x;
        selectedElement.setAttribute(x_atr, new_x);
      } 
      if (allow_y) {
        var new_y = attr_y + evt.clientY - mouse_start_y;
        //set met and max limits
        if (new_y < 1) new_y = 1;
        if (new_y > timing_diagram.total_height-attr_height+100) new_y = timing_diagram.total_height-attr_height;
        selectedElement.setAttribute(y_atr, new_y);
      } 
    }
  }
  function endDrag(evt) {
    if (selectedElement) {
      if (element_type == "svg_resize") {
        var new_row_height = timing_diagram.diagram[extra_info[1]].row_height + evt.clientY - mouse_start_y;
        if (new_row_height < 48) new_row_height = 48;
        timing_diagram.total_height += new_row_height - timing_diagram.diagram[extra_info[1]].row_height;
        timing_diagram.diagram[extra_info[1]].row_height =  new_row_height;
        selectedElement = false;
        redraw_svg();

      } else if (element_type == "ann_resize") {
        if (extra_info[3] == 't') timing_diagram.annotations[extra_info[1]].start_y += evt.clientY - mouse_start_y;
        else timing_diagram.annotations[extra_info[1]].end_y += evt.clientY - mouse_start_y;
        selectedElement = false;
        redraw_svg();

      } else if (element_type == "arrow_drag") {
        var arr_x, arr_y;
        if (extra_info[3]=='st') arr_x = timing_diagram.arrows[extra_info[1]].start_x;
        else                     arr_x = timing_diagram.arrows[extra_info[1]].end_x;
        if (extra_info[3]=='st') arr_y = timing_diagram.arrows[extra_info[1]].start_y;
        else                     arr_y = timing_diagram.arrows[extra_info[1]].end_y;
        arr_x += evt.clientX - mouse_start_x;
        arr_y += evt.clientY - mouse_start_y;
        [arr_x,arr_y] = find_grip_center(arr_x,arr_y);
        if (extra_info[3]=='st') timing_diagram.arrows[extra_info[1]].start_x = arr_x;
        else                     timing_diagram.arrows[extra_info[1]].end_x = arr_x;
        if (extra_info[3]=='st') timing_diagram.arrows[extra_info[1]].start_y = arr_y;
        else                     timing_diagram.arrows[extra_info[1]].end_y = arr_y;
        console.log(timing_diagram)
        selectedElement = false;
        var elements = document.querySelectorAll('.grip');
        for(var i=0; i<elements.length; i++){
            elements[i].style.display = 'none';
        }
        redraw_svg();
      }
    }

  }
}

function find_grip_center(x,y) {
  var radius = timing_diagram.grip_radius;
  if (grip_location[x][y] == 1) {
    for (var i=0; i<radius; i++) {
      if (grip_location[x-radius][y]==0) x+=1
      if (grip_location[x+radius][y]==0) x-=1
      if (grip_location[x][y-radius]==0) y+=1
      if (grip_location[x][y+radius]==0) y-=1
    }
  }
  return [x,y]
}