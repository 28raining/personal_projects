function makeDraggable(evt) {
  var selectedElement = false;
  var allow_x, allow_y;
  var mouse_delta_x, mouse_delta_y;
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
    if (evt.target.classList.contains('draggable')) {
      selectedElement = evt.target;
      attr_x = parseFloat(selectedElement.getAttribute("x"));
      attr_y = parseFloat(selectedElement.getAttribute("y"));
      attr_height = (parseFloat(selectedElement.getAttribute("height")));
      mouse_start_x = evt.clientX;
      mouse_start_y = evt.clientY;
      mouse_delta_x = evt.clientX - attr_x;
      mouse_delta_y = evt.clientY - attr_y;
    }
    if (evt.target.classList.contains('svg_resize')) {
      allow_x = false;
      allow_y = true;
      element_type="resize";
      extra_info = evt.target.id.split('_')[1];
    }
  }
  function drag(evt) {
    if (selectedElement) {
      evt.preventDefault();
      if (allow_x) {
        var new_x = evt.clientX - mouse_delta_x;
        selectedElement.setAttribute("x", new_x);
      } 
      if (allow_y) {
        var new_y = evt.clientY - mouse_delta_y;
        if (new_y < 1) new_y = 1;
        if (new_y > timing_diagram.total_height-attr_height+100) new_y = timing_diagram.total_height-attr_height;
        selectedElement.setAttribute("y", new_y);
      } 
    }
  }
  function endDrag(evt) {
    if (selectedElement) {
      if (element_type == "resize") {
        var new_row_height = timing_diagram.diagram[extra_info].row_height + evt.clientY - mouse_start_y;
        if (new_row_height < 48) new_row_height = 48;
        timing_diagram.total_height += new_row_height - timing_diagram.diagram[extra_info].row_height;
        timing_diagram.diagram[extra_info].row_height =  new_row_height;
        redraw_svg();
      }
    }
    selectedElement = false;
  }
}