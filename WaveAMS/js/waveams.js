var timing_diagram = {
  selected_row:0,
  selected_brick_row:-1,
  selected_brick_column:-1,
  diagram:[
      {
          row_height:48,
          y_offset:0,
          shapes:[]    ,
          label_name:"clk"
      },
      {
          row_height:48,
          y_offset:0,
          shapes:[],   
          label_name:"dat"
      }
  ],
  arrows:[],
  canvas_width:800,
  xdiv_spacing:100,
  label_width:64,
};

var array_of_svg = {
  brick_clk__0 : 'm 0 0 l 32 0 l 0 32 l 32 0',
  brick_clk__1 : 'm 0 32 l 32 0 l 0 -32 l 32 0',
  brick_horizontal : 'm 0 16 l 64 0',
  brick_data_1 : 'm 0 32 l 8 0 l 8 -32 l 32 0 l 8 32 l 8 0 m -64 -32 l 8 0 l 8 32 l 32 0 l 8 -32 l 8 0',
  brick_sine : 'm 0 16 q 16 -30 32 0 q 16 30 31 0',
  brick_arrow : 'm 16 0 l 31 32 m 1 1 l -8 0 m 8 0 l 0 -8',
  brick_ann_vertical :   'm 32 0 l 0 2 m 0 4 l 0 4 m 0 4 l 0 4 m 0 4 l 0 4 m 0 4 l 0 2',
  brick_ann_horizontal : 'm 16 16 l 2 0 m 4 0 l 4 0 m 4 0 l 4 0 m 4 0 l 4 0 m 4 0 l 2 0'
}

var array_of_grips = {
  brick_clk__0 : function(start_x,start_y) {
    var grips = '<circle cx="'+start_x+'" cy="'+start_y+'" r="3" class="grip" />';
    grips += '<circle cx="'+(start_x+16)+'" cy="'+start_y+'" r="3" class="grip" />';
    grips += '<circle cx="'+(start_x+32)+'" cy="'+start_y+'" r="3" class="grip" />';
    grips += '<circle cx="'+(start_x+32)+'" cy="'+(start_y+16)+'" r="3" class="grip" />';
    grips += '<circle cx="'+(start_x+32)+'" cy="'+(start_y+32)+'" r="3" class="grip" />';
    grips += '<circle cx="'+(start_x+48)+'" cy="'+(start_y+32)+'" r="3" class="grip" />';
    grips += '<circle cx="'+(start_x+64)+'" cy="'+(start_y+32)+'" r="3" class="grip" />';
    return grips;
  }
}

var inner_svg = "";

function add_brick(id) {
  timing_diagram.diagram[timing_diagram.selected_row].shapes.push(id);
  timing_diagram.selected_brick_row = timing_diagram.selected_row;
  timing_diagram.selected_brick_column = timing_diagram.diagram[timing_diagram.selected_row].shapes.length-1;
  redraw_svg();
}

function update_row_select(index) {
  timing_diagram.selected_row = index;
  draw_control_panel("row_sel");
  redraw_svg();
}

// Fills svg elements with specific classes with an SVG path
function draw_selectable_bricks() {
  var svg, j, element;
  var keys = Object.keys(array_of_svg);
  for (j=0; j < keys.length; j++) {
    element = document.getElementById(keys[j])
    if (element) {
      svg = '<path d="M 0 1 ' + array_of_svg[keys[j]] + '"/>';
      element.innerHTML = svg;
    }
  }
}

function draw_row_labels() {
  var row_labels_svg = ""
  var i,label,row_height,reposition_dragger_y,resize_dragger_y,text_y,fill_color;
  var prev_height = 0;
  for (i = 0; i < timing_diagram.diagram.length; i++) {
    label = timing_diagram.diagram[i].label_name;
    row_height = timing_diagram.diagram[i].row_height;
    text_y = prev_height+(row_height/2) + 10;
    reposition_dragger_y = text_y - 11;
    resize_dragger_y = prev_height+2;
    fill_color = (timing_diagram.selected_row == i) ? "black" : "white";
    if (i>0) row_labels_svg += '<rect x="3" y="'+resize_dragger_y+'" width="40" height="4" rx="2" fill="white" stroke="rgb(68, 68, 68)" stroke-width="2" class="svg_resize"/>';
    row_labels_svg += '<rect x="1" y="'+reposition_dragger_y+'" width="10" height="10" fill='+fill_color+' stroke="rgb(68, 68, 68)" stroke-width="2" class="svg_selectable" onclick="update_row_select('+i+')"/>';
    row_labels_svg += '<text x="20" y="'+text_y+'" class="svg_selectable" onclick="update_row_select('+i+')">'+label+'</text>';
    prev_height += row_height;
  }
  return row_labels_svg;
}

function draw_vertical_seperators(num_seperators) {
  var total_height = 0;
  var veritcal_seperator_svg = "";
  var i,x_st,y,y_l_end;
  for (i=0;i<timing_diagram.diagram.length;i++) total_height += timing_diagram.diagram[i].row_height+4;
  for (i=0;i<num_seperators;i++) {
    x_st = i*64 + timing_diagram.label_width;
    veritcal_seperator_svg += '<path d="M '+x_st+' 0 ';
    for(y=4;y<total_height;y+=4) {
      y_l_end = y-2;
      veritcal_seperator_svg += 'L '+x_st+' '+y_l_end+' M '+x_st+' '+y;
    }
    veritcal_seperator_svg +='" stroke = "rgb(68, 68, 68)" stroke-width="1"  fill="none" />';
  }
  return veritcal_seperator_svg;
}

function join_bricks(type_1,type_2) {
  switch (type_1) {
    case "brick_clk__0":
      switch (type_2) {
        case "brick_clk__0":
          return 'l 0 -32';
        case "brick_clk__1":
          return 'm 0 -32';
      }
    case "brick_clk__1":
      switch (type_2) {
        case "brick_clk__0":
          return '';
        case "brick_clk__1":
          return 'l 0 32 m 0 -32';
      }
  }
  return '';
}

function draw_bricks() {
  var bricks_svg = "";
  var start_x, start_y, class_list,row_height;
  var total_height = 0;
  var i;
  //first draw the path
  for (i=0;i<timing_diagram.diagram.length;i++) {
    row_height = timing_diagram.diagram[i].row_height;
    start_y = total_height + (timing_diagram.diagram[i].row_height/2) - 16;
    start_x = timing_diagram.label_width;
    bricks_svg += '<path d="M '+start_x+' '+start_y+' '
    for (j=0;j<timing_diagram.diagram[i].shapes.length;j++) {
      if(j>0) bricks_svg += join_bricks (timing_diagram.diagram[i].shapes[j-1],timing_diagram.diagram[i].shapes[j]);
      bricks_svg += array_of_svg[timing_diagram.diagram[i].shapes[j]];
    }
    bricks_svg += '" class="brick"/>';
    total_height += timing_diagram.diagram[i].row_height;
  }
  
  total_height=0;
  for (i=0;i<timing_diagram.diagram.length;i++) {
    row_height = timing_diagram.diagram[i].row_height;
    for (j=0;j<timing_diagram.diagram[i].shapes.length;j++) {
      start_x = 64*j + timing_diagram.label_width;
      start_y = total_height + (timing_diagram.diagram[i].row_height/2) - 16;
      //draw arrow grips
      bricks_svg += array_of_grips.brick_clk__0(start_x,start_y);
      class_list = ((i==timing_diagram.selected_brick_row) && (j==timing_diagram.selected_brick_column)) ? "brick_selected brick_highlight" : "brick_highlight";
      //draw the selectable rectangles
      bricks_svg += '<rect x="'+start_x+'" y="'+(start_y-2)+'" width="64" height="36" stroke-width="0" fill="none" class="'+class_list+'" id="brick_'+i+'_'+j+'" onclick="sel_brick(this.id)" />';
    }
    total_height += timing_diagram.diagram[i].row_height;
  }

  return bricks_svg;
}

function sel_brick(id) {
  var i;
  var element_new,element_old;
  var old_id = "brick_" + timing_diagram.selected_brick_row + "_" + timing_diagram.selected_brick_column; 
  var id_split = id.split('_');
  element_new = document.getElementById(id);
  if ((timing_diagram.selected_brick_row == id_split[1]) && (timing_diagram.selected_brick_column == id_split[2])) {
    //selected same brick again
    element_new.classList.remove("brick_selected");
    element_new.classList.add("brick_highlight");
    timing_diagram.selected_brick_row = -1;
    timing_diagram.selected_brick_column = -1;
  } else {
    timing_diagram.selected_brick_row = Number(id_split[1]);
    timing_diagram.selected_brick_column = Number(id_split[2]);
    element_old = document.getElementById(old_id);
    if (element_old != null) element_old.classList.add("brick_highlight");
    if (element_old != null) element_old.classList.remove("brick_selected");
    element_new.classList.add("brick_selected");
    element_new.classList.remove("brick_highlight");
  }
  draw_control_panel();
}

function clicked_trash() {
  var row=timing_diagram.selected_brick_row;
  var col=timing_diagram.selected_brick_column;
  if ((row >= 0) && (col >= 0)) {
    timing_diagram.diagram[row].shapes.splice(col,1);
    if (col >  timing_diagram.diagram[row].shapes.length-1) timing_diagram.selected_brick_column = timing_diagram.diagram[row].shapes.length-1;
    if (timing_diagram.diagram[row].shapes.length == 0) {
      timing_diagram.selected_brick_column = -1;
      timing_diagram.selected_brick_row = -1;
    }
    redraw_svg();
  }
  console.log(timing_diagram)
}

function draw_control_panel(info) {
  var row = timing_diagram.selected_brick_row;
  var col = timing_diagram.selected_brick_column;
  var content;
  if (info == "row_sel") {
    content = '<p>Chose a row name...</p>';
    content += '<input type="text" width="'+timing_diagram.label_width+'" value="'+timing_diagram.diagram[timing_diagram.selected_row].label_name+'" onchange="update_row_label(this.value)"></input>';
  } else if ((row==-1) && (col==-1)) {
    content = '<p>Click an element to modify it...</p>';
  } else {
    var type = timing_diagram.diagram[row].shapes[col].split('__');
    switch (type[0]) {
      case "brick_clk":
        content = control_panel_brick_clk(type[1]) 
      break;
    }
  }
  document.getElementById("control_panel").innerHTML = content;
}

function update_row_label(new_label) {
  document.getElementById('test_text').innerHTML = '<text x="0" y="0">'+new_label+'</text>';
  var testElement = document.querySelector('#test_text'); 
  var bbox = testElement.getBBox(); 
  var min_width =  Math.round(bbox.width) + 30;
  if(min_width > timing_diagram.label_width) timing_diagram.label_width = min_width;
  timing_diagram.diagram[timing_diagram.selected_row].label_name = new_label;
  redraw_svg();
}

function control_panel_brick_clk(num){
  var i;
  var content="";
  var checked;
  for (i=0;i<2;i++) {
    checked = num==i ? 'checked="checked"' : '';
    content += '<div class="brick_changer"><input type="radio" onclick="update_brick(this.value)" name="sel" value="'+i+'" '+checked+'><svg viewBox="0 0 64 38"><path d="M 0 1 '+array_of_svg["brick_clk__"+i+""]+'"></path></svg><br></div>';
  }
  return content;
}

function update_brick(val) {
  var row = timing_diagram.selected_brick_row;
  var col = timing_diagram.selected_brick_column;
  var type = timing_diagram.diagram[row].shapes[col];
  var new_type = type.split('__')[0] + '__' + val;
  timing_diagram.diagram[row].shapes[col] = new_type;
  //change the brick clicker to be the selected type
  var element = document.getElementById(type);
  element.id = new_type;
  draw_selectable_bricks();
  redraw_svg();
}

function add_row() {
  timing_diagram.diagram.push(
  {
    row_height:48,
    y_offset:0,
    shapes:[],
    label_name:'ndef'     
  });
  redraw_svg();
}

function resize_svg() {
  var i=0, total_height = 4;
  for (i=0; i<timing_diagram.diagram.length; i++) total_height += timing_diagram.diagram[i].row_height;
  document.getElementById('main_svg').style.height = total_height + 'px';
}

function redraw_svg() {
  resize_svg();
  inner_svg="";
  inner_svg += draw_vertical_seperators(14);
  inner_svg += draw_row_labels();
  inner_svg += draw_bricks();
  document.getElementById('main_svg').innerHTML = inner_svg;
}


function initialise() {
  draw_selectable_bricks();
  draw_control_panel();
  redraw_svg();
}
