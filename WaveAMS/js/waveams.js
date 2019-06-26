var timing_diagram = {
  selected_row:0,
  //selected_brick_row:-1,
  //selected_brick_column:-1,
  selected_item: "",
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
  annotations:[],
  annotation_width:0,
  arrows:[],
  canvas_width:800,
  xdiv_spacing:100,
  label_width:64,
  total_height:96
};

var array_of_svg = {
  brick_clk__0 : ['m',0,0,'l',32,0,'l',0,32,'l',32,0],
  brick_clk__1 : ['m',0,32,'l',32,0,'l',0,-32,'l',32,0],
  brick_horizontal : ['m',0,16,'l',64,0],
  brick_data_1 : ['m',0,32,'l',8,0,'l',8,-32,'l',32,0,'l',8,32,'l',8,0,'m',-64,-32,'l',8,0,'l',8,32,'l',32,0,'l',8,-32,'l',8,0],
  brick_sine : ['m',0,16,'q',16,-30,32,0,'q',16,30,32,0],
  brick_arrow : ['m',16,0,'l',31,32,'m',1,1,'l',-8,0,'m',8,0,'l',0,-8],
  brick_ann_vertical : ['m',32,0,'l',0,2,'m',0,4,'l',0,4,'m',0,4,'l',0,4,'m',0,4,'l',0,4,'m',0,4,'l',0,2],
  brick_ann_horizontal : ['m',16,16,'l',2,0,'m',4,0,'l',4,0,'m',4,0,'l',4,0,'m',4,0,'l',4,0,'m',4,0,'l',2,0],
  brick_ann_group : ['m',36,0,'l',-8,0,'l',0,32,'l',8,0],
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

function brick_to_path(bk_arry, scale_x=1, scale_y=1) {
  var i;
  var path="";
  for (i=0;i<bk_arry.length;i++) {
    if (bk_arry[i]=='m' || bk_arry[i]=='l') {
      path = path + ' ' + bk_arry[i] + ' ' + (bk_arry[i+1]*scale_x) + ' ' + (bk_arry[i+2]*scale_y);
      i = i+2;
    } else if (bk_arry[i]=='q') {
      path = path + ' ' + bk_arry[i] + ' ' + (bk_arry[i+1]*scale_x) + ' ' + (bk_arry[i+2]*scale_y) + ' ' + (bk_arry[i+3]*scale_x) + ' ' + (bk_arry[i+4]*scale_y);
      i = i+4;
    }
  }
  return path;
}

function add_brick(id) {
  timing_diagram.diagram[timing_diagram.selected_row].shapes.push(id);
  redraw_svg();
  var id = "brick_" + timing_diagram.selected_row + "_" + (timing_diagram.diagram[timing_diagram.selected_row].shapes.length-1);
  sel_brick(id)
}

function add_annotation(id) {
  timing_diagram.annotations.push({
    type: id,
    text: 'na',
    start_y : 6,
    end_y: 50
  })
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
      svg = '<path d="M 0 1 ' + brick_to_path(array_of_svg[keys[j]]) + '"/>';
      element.innerHTML = svg;
    }
  }
}

function draw_row_labels() {
  var row_labels_svg = ""
  var i,label,row_height,reposition_dragger_y,resize_dragger_y,text_y,fill_color;
  var prev_height = 0;
  var an_w = timing_diagram.annotation_width;
  for (i = 0; i < timing_diagram.diagram.length; i++) {
    label = timing_diagram.diagram[i].label_name;
    row_height = timing_diagram.diagram[i].row_height;
    text_y = prev_height+(row_height/2) + 10;
    reposition_dragger_y = text_y - 11;
    prev_height += row_height;
    resize_dragger_y = prev_height+2;
    fill_color = (timing_diagram.selected_row == i) ? "black" : "white";
    row_labels_svg += '<rect x="'+(an_w+3)+'" y="'+resize_dragger_y+'" width="40" height="4" rx="2" fill="white" stroke="rgb(68, 68, 68)" stroke-width="2" class="svg_resize draggable" id="row_'+i+'_resizer"/>';
    row_labels_svg += '<rect x="'+(an_w+1)+'" y="'+reposition_dragger_y+'" width="10" height="10" fill='+fill_color+' stroke="rgb(68, 68, 68)" stroke-width="2" class="svg_selectable" onclick="update_row_select('+i+')"/>';
    row_labels_svg += '<text x="'+(an_w+20)+'" y="'+text_y+'" class="svg_selectable" onclick="update_row_select('+i+')">'+label+'</text>';
  }
  timing_diagram.total_height = prev_height;
  return row_labels_svg;
}

function draw_vertical_seperators(num_seperators) {
 // var total_height = 0;
  var veritcal_seperator_svg = "";
  var i,x_st,y,y_l_end;
//  for (i=0;i<timing_diagram.diagram.length;i++) total_height += timing_diagram.diagram[i].row_height+4;
  for (i=0;i<num_seperators;i++) {
    x_st = i*64 + timing_diagram.label_width + timing_diagram.annotation_width;
    veritcal_seperator_svg += '<path d="M '+x_st+' 0 ';
    for(y=4;y<timing_diagram.total_height;y+=4) {
      y_l_end = y-2;
      veritcal_seperator_svg += 'L '+x_st+' '+y_l_end+' M '+x_st+' '+y;
    }
    veritcal_seperator_svg +='" stroke = "rgb(68, 68, 68)" stroke-width="1"  fill="none" />';
  }
  return veritcal_seperator_svg;
}

function join_bricks(type_1,type_2,x_scale=1,y_scale=1) {
  switch (type_1) {
    case "brick_clk__0":
      switch (type_2) {
        case "brick_clk__0":
          return 'l 0 '+(-32*y_scale);
        case "brick_clk__1":
          return 'm 0 '+(-32*y_scale);
      }
    case "brick_clk__1":
      switch (type_2) {
        case "brick_clk__0":
          return '';
        case "brick_clk__1":
          return 'l 0 '+(32*y_scale)+' m 0 '+(-32*y_scale);
      }
    case "brick_sine":
      switch (type_2) {
        case "brick_sine":
          return 'm 0 '+(-16*y_scale);
      }
  }
  return '';
}

function draw_bricks() {
  var bricks_svg = "";
  var start_x, start_y, class_list,row_height,y_scale;
  var total_height = 0;
  var i;
  //draw the path of the brick
  for (i=0;i<timing_diagram.diagram.length;i++) {
    row_height = timing_diagram.diagram[i].row_height;
    start_y = total_height + 8;
    start_x = timing_diagram.label_width + timing_diagram.annotation_width;
    y_scale = (row_height-16)/32;
    bricks_svg += '<path d="M '+start_x+' '+start_y+' '
    for (j=0;j<timing_diagram.diagram[i].shapes.length;j++) {
      if(j>0) bricks_svg += join_bricks (timing_diagram.diagram[i].shapes[j-1],timing_diagram.diagram[i].shapes[j],1,y_scale);
      bricks_svg += brick_to_path(array_of_svg[timing_diagram.diagram[i].shapes[j]],1,y_scale);
    }
    bricks_svg += '" class="brick"/>';
    total_height += timing_diagram.diagram[i].row_height;
  }
  
  total_height=0;
  for (i=0;i<timing_diagram.diagram.length;i++) {
    row_height = timing_diagram.diagram[i].row_height;
    y_scale = (row_height-16)/32;
    for (j=0;j<timing_diagram.diagram[i].shapes.length;j++) {
      start_x = 64*j + timing_diagram.label_width + timing_diagram.annotation_width;
      start_y = total_height + 8;
      //draw arrow grips
      bricks_svg += array_of_grips.brick_clk__0(start_x,start_y);
      class_list = ((dec_sel()[0] == 'b') && (i==dec_sel()[1]) && (j==dec_sel()[2])) ? "brick_selected brick_highlight" : "brick_highlight";
      //draw the selectable rectangles
      bricks_svg += '<rect x="'+start_x+'" y="'+(start_y-2)+'" width="64" height="'+(4+32*y_scale)+'" stroke-width="0" fill="none" class="'+class_list+'" id="brick_'+i+'_'+j+'" onclick="sel_brick(this.id)" />';
    }
    total_height += timing_diagram.diagram[i].row_height;
  }

  return bricks_svg;
}

//decode selected item. I used one variable for selected item so trash click knows what to do
function dec_sel() {
  sel_id = timing_diagram.selected_item.split('_');
  if      (sel_id[0] == 'b') return ['b',sel_id[1],sel_id[2]];
  else if (sel_id[0] == 'a') return ['a',sel_id[1],0];
  else return [null,0,0];
}

function sel_brick(id) {
  var i;
  var element_new,element_old;
  var id_split = id.split('_');
  element_new = document.getElementById(id);
  if ((dec_sel()[0]=='b') && (dec_sel()[1] == id_split[1]) && (dec_sel()[2] == id_split[2])) {
    //selected same brick again
    element_new.classList.remove("brick_selected");
    element_new.classList.add("brick_highlight");
    timing_diagram.selected_item = "";
  } else {
    var old_id = "brick_" + dec_sel()[1] + "_" + dec_sel()[2]; 
    timing_diagram.selected_item = 'b_' + Number(id_split[1]) + '_' +  Number(id_split[2]);
    element_old = document.getElementById(old_id);
    if (element_old != null) element_old.classList.add("brick_highlight");
    if (element_old != null) element_old.classList.remove("brick_selected");
    element_new.classList.add("brick_selected");
    element_new.classList.remove("brick_highlight");
  }
  draw_control_panel('brick');
}

function clicked_trash() {
  var sel_type = dec_sel()[0]
  if (sel_type == 'b') {
    var row= dec_sel()[1];
    var col= dec_sel()[2];
    if ((row >= 0) && (col >= 0)) {
      timing_diagram.diagram[row].shapes.splice(col,1);
      redraw_svg();
      if (timing_diagram.diagram[row].shapes.length == 0) {
        timing_diagram.selected_item = "";
        draw_control_panel('trash');
      } else if (col >  timing_diagram.diagram[row].shapes.length-1) {
        var id = "brick_" + timing_diagram.selected_row + "_" + (timing_diagram.diagram[row].shapes.length-1);
        sel_brick(id)
      } 
    }
  } else if (sel_type == 'a') {
    timing_diagram.annotations.splice(dec_sel()[1],1);
    if (timing_diagram.annotations.length == 0) timing_diagram.annotation_width=0;
    redraw_svg();
  }
}


function draw_control_panel(info) {
  var content;
  var split_info = info.split('_');
  if ((split_info[0]=="annotation") || (split_info[0]=="drag")) {
    timing_diagram.selected_item = 'a_'+split_info[1];
    content = '<p>Annotation name...</p>';
    content += '<input type="text" value="'+timing_diagram.annotations[split_info[1]].text+'" onchange="update_ann_text('+split_info[1]+',this.value)"></input>';
    timing_diagram.sele
  } else if (info == "row_sel") {
    content = '<p>Chose a row name...</p>';
    content += '<input type="text" value="'+timing_diagram.diagram[timing_diagram.selected_row].label_name+'" onchange="update_row_label(this.value)"></input>';
  } else if (timing_diagram.selected_item == "") {
    content = '<p>Click an element to modify it...</p>';
  } else {
    var row = dec_sel()[1];
    var col = dec_sel()[2];
    var type = timing_diagram.diagram[row].shapes[col].split('__');
    switch (type[0]) {
      case "brick_clk":
        content = control_panel_brick_clk(type[1]) 
      break;
    }
  }
  document.getElementById("control_panel").innerHTML = content;
}

//save the label name then measure the width of the label box and resize the SVG so the label fits
function update_row_label(new_label) {
  var i;
  var min_width = 0;
  var label_width;
  timing_diagram.diagram[timing_diagram.selected_row].label_name = new_label;
  for (i=0;i<timing_diagram.diagram.length; i++) {
    label_width = get_text_width(timing_diagram.diagram[i].label_name)  + 30;
    if (label_width > min_width) min_width = label_width;
  }
  timing_diagram.label_width = min_width;
  redraw_svg();
}

function update_ann_text(i,val) {
  timing_diagram.annotations[i].text = val;
  redraw_svg();
}


function get_text_width(text) {
  document.getElementById('test_text').innerHTML = '<text x="0" y="0">'+text+'</text>';
  var testElement = document.querySelector('#test_text'); 
  var bbox = testElement.getBBox(); 
  return Math.round(bbox.width);
}

//what to do when property of brick is changed
function control_panel_brick_clk(num){
  var i;
  var content="";
  var checked;
  for (i=0;i<2;i++) {
    checked = num==i ? 'checked="checked"' : '';
    content += '<div class="brick_changer"><input type="radio" onclick="update_brick(this.value)" name="sel" value="'+i+'" '+checked+'><svg viewBox="0 0 64 38"><path d="M 0 1 '+brick_to_path(array_of_svg["brick_clk__"+i+""])+'"></path></svg><br></div>';
  }
  return content;
}

function update_brick(val) {
  var row = dec_sel()[1];
  var col = dec_sel()[2];
  var type = timing_diagram.diagram[row].shapes[col];
  var new_type = type.split('__')[0] + '__' + val;
  var i,selector_type;
  timing_diagram.diagram[row].shapes[col] = new_type;
  //change the brick clicker to be the selected type
  //search for a selector of this type and change it, the id keeps changing...
  for (i=0;i<100;i++) {
    selector_type = type.split('__')[0] + '__' + i;
    var element = document.getElementById(selector_type);
    if(element) {
      element.id = new_type;
      draw_selectable_bricks();
      redraw_svg();
      break;
    }
  }
}

function add_row() {
  timing_diagram.diagram.push(
  {
    row_height:48,
    y_offset:0,
    shapes:[],
    label_name:'ndef'     
  });
  timing_diagram.total_height += 48;
  redraw_svg();
}

function remove_row() { 
  if (timing_diagram.diagram.length > 1) {
    timing_diagram.diagram.splice(timing_diagram.selected_row,1);
    timing_diagram.selected_row-=1;
    redraw_svg();
  }
}

function resize_svg() {
  document.getElementById('main_svg').style.height = (timing_diagram.total_height + 100) + 'px';
}

function draw_plus_minus_row() {
 // var i=0, total_height = 10;//4;
  var svg="";
 // for (i=0; i<timing_diagram.diagram.length; i++) total_height += timing_diagram.diagram[i].row_height;
  svg += '<path d="M 10 '+(timing_diagram.total_height+16)+' l 0 20 m -10 -10 l 20 0" class="brick"/>';
  svg += '<rect x="0" y="'+(timing_diagram.total_height+16)+'" width="20" height="20" class="plus_minus_row_select" onclick="add_row()" />'
  svg += '<path d="M 25 '+(timing_diagram.total_height+26)+' l 20 0" class="brick"/>';
  svg += '<rect x="25" y="'+(timing_diagram.total_height+16)+'" width="20" height="20" class="plus_minus_row_select" onclick="remove_row()" />'
  return svg;
}

function draw_annotations() {
  var svg="";
  if (timing_diagram.annotations.length>0) {
    var number_ann_per_y=[];
    var i,j;
    var start_x;
    var min_width=0;
    var ann_wid = 26;
    var original_height = 32;
    //calculate number of annotations at each y point. This is just to figure out required width
    for (i=0;i<timing_diagram.total_height;i++) number_ann_per_y[i] = 0;
    for (i=0;i<timing_diagram.annotations.length;i++) {
      var start_y = timing_diagram.annotations[i].start_y;
      var end_y =  timing_diagram.annotations[i].end_y;
      for(j=start_y; j<end_y; j++) {
        number_ann_per_y[j] += 1;
        if (number_ann_per_y[j]>min_width) min_width=number_ann_per_y[j];
      }
    }
    timing_diagram.annotation_width=6+ min_width*ann_wid;
    //draw the annotations
    for (i=0;i<timing_diagram.total_height;i++) number_ann_per_y[i] = 0;
    for (i=0;i<timing_diagram.annotations.length;i++) {
      var start_y = timing_diagram.annotations[i].start_y;
      var end_y =  timing_diagram.annotations[i].end_y;
      var height =  end_y - start_y;
      var num_below = 0;
      for (j=start_y; j<end_y; j++) if (number_ann_per_y[j] > num_below) num_below = number_ann_per_y[j];

      start_x = timing_diagram.annotation_width - 40 - ann_wid*num_below;
      var text_start_x = start_x + 23;
      //draw some text
      var label_width = get_text_width(timing_diagram.annotations[i].text)
      var text_start_y = start_y + (height+label_width)/2;
      svg += '<text transform="translate('+text_start_x+','+text_start_y+') rotate(270)">'+timing_diagram.annotations[i].text+'</text>';
      //draw the actual annotation
      svg += '<path d="M '+start_x+' '+start_y+' '+brick_to_path(array_of_svg[timing_diagram.annotations[i].type],1,height/original_height)+'" class="brick"/>';
      //draw the selection rectangle
      svg += '<rect id="annotation_'+i+'" class="annotation_group_sel" onclick="draw_control_panel(this.id)" x="'+(text_start_x-10)+'" y="'+start_y+'" width="20" height="'+height+'"/>';
      //draw the draggable rectangles
      svg += '<rect id="drag_'+i+'_ann_t" class="draggable ann_resize" x="'+(start_x + 28)+'" y="'+(start_y-1)+'" width="8" height="2"/>';
      svg += '<rect id="drag_'+i+'_ann_b" class="draggable ann_resize" x="'+(start_x + 28)+'" y="'+(end_y-1)+'" width="8" height="2"/>';
      for(j=start_y; j<end_y; j++) number_ann_per_y[j] += 1;
    }
  }
  return svg;
}

function redraw_svg() {
  resize_svg();
  inner_svg="";
  inner_svg += draw_annotations();
  inner_svg += draw_vertical_seperators(14);
  inner_svg += draw_row_labels();
  inner_svg += draw_bricks();
  inner_svg += draw_plus_minus_row()
  document.getElementById('main_svg').innerHTML = inner_svg;
}


function initialise() {
  draw_selectable_bricks();
  draw_control_panel('initial');
  redraw_svg();
}
