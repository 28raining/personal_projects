var timing_diagram = {
  selected_row:0,
  //selected_brick_row:-1,
  //selected_brick_column:-1,
  selected_item: "",
  diagram:[
      {
          row_height:48,
          y_offset:0,
          shapes:[],
          label_name:"clk",
          title: '',
          title_height: 0
      },
      {
          row_height:48,
          y_offset:0,
          shapes:[],   
          label_name:"dat",
          title: '',
          title_height: 0
      }
  ],
  annotations:[],
  annotation_width:0,
  arrows:[],
  xdiv_spacing:100,
  label_width:64,
  total_width:800,
  total_height:116,
  y_start : 20,
  grip_radius : 4,
  snapping : true
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
  brick_title : [],
}

var grip_location = [];

function array_of_grips(type, start_x, start_y) {
  var grips = '';
  var radius = timing_diagram.grip_radius;
  var i,xx,yy;
  if (type == 'brick_clk__0') {
    var ctr = [
      { x:start_x,    y:start_y },
      { x:start_x+16, y:start_y },
      { x:start_x+32, y:start_y },
      { x:start_x+32, y:start_y+16 },
      { x:start_x+32, y:start_y+32 },
      { x:start_x+48, y:start_y+32 },
      { x:start_x+64, y:start_y+32 }
    ]
  }
  for (i=0;i<ctr.length;i++) {
    grips += '<circle cx="'+ctr[i].x+'" cy="'+ctr[i].y+'" r="'+radius+'" class="grip" id="grip_'+ctr[i].x+'_'+ctr[i].y+'"/>';
    for (xx=(ctr[i].x-radius); xx<(ctr[i].x+radius+1); xx++) {
      for (yy=(ctr[i].y-radius); yy<(ctr[i].y+radius+1); yy++) {
        grip_location[xx][yy] = 1;
      }
    }
    
  }
  return grips;
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
  if (id == "brick_title") {
    var row = timing_diagram.selected_row;
    timing_diagram.diagram[row].title = 'pacccc';
    timing_diagram.diagram[row].title_height = 20;
    timing_diagram.total_height += timing_diagram.diagram[row].title_height;
  } else {
    timing_diagram.annotations.push({
      type: id,
      text: 'na',
      start_y : 6,
      end_y: 50
    })
  }
  redraw_svg();
}

function add_arrow(id) {
  timing_diagram.arrows.push({
    type: 0,
    color: "#000000",
    opacity : 0.4,
    text: 'temp',
    start_x : 40,
    end_x : 150,
    start_y : 10,
    end_y : 10,
    pointer_type : 0
  })
  draw_control_panel("arrow_" +  (timing_diagram.arrows.length-1));
  redraw_svg();
  alertify.notify('Drag the end of the arrow to reposition', 'warning', 4);
}

function update_row_select(index) {
  timing_diagram.selected_row = index;
  draw_control_panel("rowSel");
  redraw_svg();
}

function toggle_snapping (checked) {
  if (checked) timing_diagram.snapping = true;
  else timing_diagram.snapping = false;
}

// Fills svg elements with specific classes with an SVG path
function draw_selectable_bricks() {
  var svg, j, element;
  var keys = Object.keys(array_of_svg);
  for (j=0; j < keys.length; j++) {
    element = document.getElementById(keys[j])
    if (element) {
      if (keys[j]=='brick_title') svg = '<text x="0" y="28" class="brick_title">ABC</text>';
      else svg = '<path d="M 0 1 ' + brick_to_path(array_of_svg[keys[j]]) + '"/>';
      element.innerHTML = svg;
    }
  }
}

function draw_row_labels_and_titles() {
  var row_labels_svg = ""
  var i,label,row_height,reposition_dragger_y,resize_dragger_y,text_y,fill_color;
  var title_x;
  var prev_height = timing_diagram.y_start;
  var an_w = timing_diagram.annotation_width;
  var onclick = ''
  for (i = 0; i < timing_diagram.diagram.length; i++) {
    //draw the title
    if (timing_diagram.diagram[i].title_height > 0) {
      title_x = (timing_diagram.total_width - get_text_width(timing_diagram.diagram[i].title)) / 2;
      onclick = 'onclick="draw_control_panel(this.id)"'
      row_labels_svg += '<rect x="{0}" y="{1}" width="{2}" height="{3}" class="title_background"/>'.format(timing_diagram.label_width+an_w-2,prev_height,timing_diagram.total_width-timing_diagram.label_width+an_w,timing_diagram.diagram[i].title_height + 8)
      prev_height += timing_diagram.diagram[i].title_height;
      row_labels_svg += '<text x="{1}" y="{2}" id="titleSel_{3}" {4}>{0}</text>'.format(timing_diagram.diagram[i].title,title_x,prev_height,i,onclick)
      
    }
    label = timing_diagram.diagram[i].label_name;
    row_height = timing_diagram.diagram[i].row_height;
    text_y = prev_height+(row_height/2) + 10;
    reposition_dragger_y = text_y - 11;
    //daw the label
    resize_dragger_y = row_height + prev_height + 2;
    fill_color = (timing_diagram.selected_row == i) ? "black" : "white";
    row_labels_svg += '<rect x="'+(an_w+3)+'" y="'+resize_dragger_y+'" width="40" height="4" rx="2" fill="white" stroke="rgb(68, 68, 68)" stroke-width="2" class="svg_resize draggable" id="row_'+i+'_resizer"/>';
    row_labels_svg += '<rect x="'+(an_w+1)+'" y="'+reposition_dragger_y+'" width="10" height="10" fill='+fill_color+' stroke="rgb(68, 68, 68)" stroke-width="2" class="svg_selectable" onclick="update_row_select('+i+')"/>';
    row_labels_svg += '<text x="'+(an_w+20)+'" y="'+text_y+'" class="svg_selectable" onclick="update_row_select('+i+')">'+label+'</text>';
    prev_height += row_height;
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
    veritcal_seperator_svg += '<path d="M '+x_st+' '+timing_diagram.y_start+' ';
    for(y=4;y<timing_diagram.total_height;y+=4) {
      y_l_end = y-2;
      veritcal_seperator_svg += 'l 0 2 m 0 2 ';
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
    start_y = total_height + timing_diagram.y_start + 8 + timing_diagram.diagram[i].title_height;
    start_x = timing_diagram.label_width + timing_diagram.annotation_width;
    y_scale = (row_height-16)/32;
    bricks_svg += '<path d="M '+start_x+' '+start_y+' '
    for (j=0;j<timing_diagram.diagram[i].shapes.length;j++) {
      if(j>0) bricks_svg += join_bricks (timing_diagram.diagram[i].shapes[j-1],timing_diagram.diagram[i].shapes[j],1,y_scale);
      bricks_svg += brick_to_path(array_of_svg[timing_diagram.diagram[i].shapes[j]],1,y_scale);
    }
    bricks_svg += '" class="brick"/>';
    total_height += timing_diagram.diagram[i].row_height + timing_diagram.diagram[i].title_height;
  }
  
  total_height=0;
  for (i=0;i<timing_diagram.diagram.length;i++) {
    row_height = timing_diagram.diagram[i].row_height;
    y_scale = (row_height-16)/32;
    for (j=0;j<timing_diagram.diagram[i].shapes.length;j++) {
      start_x = 64*j + timing_diagram.label_width + timing_diagram.annotation_width;
      start_y = total_height + timing_diagram.y_start + 8 + timing_diagram.diagram[i].title_height;;
      //draw arrow grips
      bricks_svg += array_of_grips('brick_clk__0',start_x,start_y);
      class_list = ((dec_sel()[0] == 'b') && (i==dec_sel()[1]) && (j==dec_sel()[2])) ? "brick_selected brick_highlight" : "brick_highlight";
      //draw the selectable rectangles
      bricks_svg += '<rect x="'+start_x+'" y="'+(start_y-2)+'" width="64" height="'+(4+32*y_scale)+'" stroke-width="0" fill="none" class="'+class_list+'" id="brick_'+i+'_'+j+'" onclick="sel_brick(this.id)" />';
    }
    total_height += timing_diagram.diagram[i].row_height + timing_diagram.diagram[i].title_height;;
  }

  return bricks_svg;
}

//decode selected item. I used one variable for selected item so trash click knows what to do
function dec_sel() {
  sel_id = timing_diagram.selected_item.split('_');
  if      (sel_id[0] == 'b') return ['b',sel_id[1],sel_id[2]];
  else if (sel_id[0] == 'a') return ['a',sel_id[1],0];
  else if (sel_id[0] == 'arr') return ['arr',sel_id[1],0];
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
  } else if (sel_type == 'arr') {
    timing_diagram.arrows.splice(dec_sel()[1],1);
    timing_diagram.selected_item = "";
    draw_control_panel("trash");
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
  } else if (split_info[0] == "arrow") {
    timing_diagram.selected_item = 'arr_'+split_info[1];
    content = control_panel_arrow(split_info[1])
  } else if (split_info[0] == "rowSel") {
    content = '<p>Chose a row name...</p>';
    content += '<input type="text" value="'+timing_diagram.diagram[timing_diagram.selected_row].label_name+'" onchange="update_row_label(this.value)"></input>';
  } else if (split_info[0] == "titleSel") {
    content = '<p>Chose the title...</p>';
    content += '<input type="text" value="{0}" onchange="update_row_title(this.value,{1})"></input>'.format(timing_diagram.diagram[split_info[1]].title,split_info[1]);
  } else if (timing_diagram.selected_item == "") {
    content = '<p>Click an element to modify it...</p>';
  } else {
    var row = dec_sel()[1];
    var col = dec_sel()[2];
    var type = timing_diagram.diagram[row].shapes[col].split('__');
    switch (type[0]) {
      case "brick_clk":
        content = control_panel_brick(type[1]) 
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

function update_row_title(val, id){
  timing_diagram.diagram[id].title=val;
  redraw_svg();
}

function update_ann_text(i,val) {
  timing_diagram.annotations[i].text = val;
  redraw_svg();
}


function get_text_width(text, size="1rem") {
  document.getElementById('test_text').innerHTML = '<text x="0" y="0" style="font-size:'+size+'">'+text+'</text>';
  var testElement = document.querySelector('#test_text'); 
  var bbox = testElement.getBBox(); 
  return Math.round(bbox.width);
}

//Add selections for arrow types
function control_panel_arrow(id) {
  var i;
  var content='<div class="control_panel_b1">';
  var checked;
  var arrow = timing_diagram.arrows[id];
  var type = timing_diagram.arrows[id].pointer_type;
  var arr_end_type =[];
  var arr_shape_type =[];
  //first draw the arrow end selection
  arr_end_type.push('<path d="M 8 11 l 48 0"></path>');
  arr_end_type.push('<path d="M 8 11 l 8 8 m -8 -8 l 8 -8 m -9 8 l 49 0"></path>');
  arr_end_type.push('<path d="M 8 11 l 49 0 m -1 0 l -8 8 m 8 -8 l -8 -8"></path>');
  arr_end_type.push('<path d="M 8 11 l 8 8 m -8 -8 l 8 -8 m -9 8 l 49 0 m -1 0 l -8 8 m 8 -8 l -8 -8"></path>');
  for (i=0;i<arr_end_type.length;i++) {
    checked = type==i ? 'checked="checked"' : '';
    content += '<div class="arrow_changer"><input type="radio" onclick="update_arrow(this.name,this.value)" name="head_sel" value="'+i+'" '+checked+'><svg viewBox="0 0 64 22">'+arr_end_type[i]+'</svg></div>';
  }
  content+='</div>';
  content+='<div class="control_panel_seperator"></div>';
  //then the arrow shape selection
  var type = timing_diagram.arrows[id].type;
  content+='<div class="control_panel_b2">';
  arr_shape_type.push('<path d="M 8 11 l 40 0"></path>');
  arr_shape_type.push('<path d="M 8 4 l 20 0 l 0 14 l 20 0"></path>');
  arr_shape_type.push('<path d="M 12 0 l 0 10 l 36 0 l 0 10"></path>');
  arr_shape_type.push('<path d="M 12 0 l 0 20 l 32 0"></path>');
  arr_shape_type.push('<path d="M 8 22 q 24 -22 48 0 "></path>');
  arr_shape_type.push('<path d="M 8 6 q 24 22 48 0 "></path>');
  arr_shape_type.push('<path d="M 8 15 q 12 -22 24 0 q 12 22 24 0 "></path>');
  arr_shape_type.push('<path d="M 8 15 q 12 22 24 0 q 12 -22 24 0 "></path>');
  for (i=0;i<arr_shape_type.length;i++) {
    checked = type==i ? 'checked="checked"' : '';
    content += '<div class="arrow_type"><input type="radio" onclick="update_arrow(this.name,this.value)" name="type_sel" value="'+i+'" '+checked+'><svg viewBox="0 0 64 30">'+arr_shape_type[i]+'</svg></div>';
  }
  content +='</div>';
  content +='<div class="control_panel_seperator"></div>';
  //text modifier and color selector
  content +='<div class="control_panel_b3">';
  content += '<input type="text" value="'+arrow.text+'" onchange="update_arrow(this.type,this.value)"></input>';
  content +='</div>';
  content +='<div class="control_panel_seperator"></div>';
  content +='<div class="control_panel_b4">';
  content += '<div class="control_panel_3rd"><p>Color:</p><input type="color" value="'+arrow.color+'" onchange="update_arrow(this.type,this.value)"></input></div>';
  content += '<div class="control_panel_3rd"><p>Opacity:</p><input type="text" name="opacity" value="'+arrow.opacity+'" class="control_panel_number" onchange="update_arrow(this.name,this.value)"></input></div>';
  content +='</div>';
  return content;
}

//what to do when property of brick is changed
function control_panel_brick(num){
  var i;
  var content="";
  var checked;
  for (i=0;i<2;i++) {
    checked = num==i ? 'checked="checked"' : '';
    content += '<div class="brick_changer"><input type="radio" onclick="update_brick(this.value)" name="sel" value="'+i+'" '+checked+'><svg viewBox="0 0 64 38"><path d="M 0 1 '+brick_to_path(array_of_svg["brick_clk__"+i+""])+'"></path></svg></div>';
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

function update_arrow (type,val) {
  var arrow_id = dec_sel()[1];
  if (type == "head_sel") {
    timing_diagram.arrows[arrow_id].pointer_type = val;
  } else if (type == "type_sel") {
    timing_diagram.arrows[arrow_id].type = val;
  } else if (type == "text") {
    timing_diagram.arrows[arrow_id].text = val;
  } else if (type == "color") {
    timing_diagram.arrows[arrow_id].color = val;
  } else if (type == "opacity") {
    timing_diagram.arrows[arrow_id].opacity = val;
  }
  redraw_svg();
}

function add_row() {
  timing_diagram.diagram.push(
  {
    row_height:48,
    y_offset:0,
    shapes:[],
    label_name:'ndef',
    title_height:0   
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

function draw_arrow() {
  var i;
  var svg ='';
  var st_x, st_y, end_x, end_y, pointer_type;
  var s_p1_x,s_p1_y,s_p2_x,s_p2_y,e_p1_x,e_p1_y,e_p2_x,e_p2_y;
  var s_ext_x,s_ext_y,e_ext_x,e_ext_y;  //added 'extensions' so the arrow triangles don't start in exactly same place as the arrow ends, because that looks messy
  var type;
  var infl_x, infl_y;
  var mid_x, mid_y;
  var arr_path = ''
  var text,color,opacity;
  for (i=0; i<timing_diagram.arrows.length; i++) {
    st_x = timing_diagram.arrows[i].start_x;
    st_y = timing_diagram.arrows[i].start_y;
    end_x = timing_diagram.arrows[i].end_x;
    end_y = timing_diagram.arrows[i].end_y;
    pointer_type = timing_diagram.arrows[i].pointer_type;
    type = timing_diagram.arrows[i].type;
    text = timing_diagram.arrows[i].text;
    color = timing_diagram.arrows[i].color;
    opacity = timing_diagram.arrows[i].opacity;
    svg += '<path d="M '+st_x+' '+st_y;
    arr_path = '';
    mid_x = st_x + (end_x - st_x)/2;
    mid_y = st_y + (end_y - st_y)/2;
    //draw the arrow curve as defined by the user
    if (type == 0) {
      [s_ext_x,s_ext_y,s_p1_x,s_p1_y,s_p2_x,s_p2_y] = rotate_arrow_head(st_x,st_y,end_x,end_y,10);
      [e_ext_x,e_ext_y,e_p1_x,e_p1_y,e_p2_x,e_p2_y] = rotate_arrow_head(end_x,end_y,st_x,st_y,10);
      arr_path += ' L '+end_x+' '+end_y;
    } else if (type == 1) {
      [s_ext_x,s_ext_y,s_p1_x,s_p1_y,s_p2_x,s_p2_y] = rotate_arrow_head(0,0,1,0,10);
      [e_ext_x,e_ext_y,e_p1_x,e_p1_y,e_p2_x,e_p2_y] = rotate_arrow_head(1,0,0,0,10);
      arr_path += ' l {0} {1} l {2} {3} l {4} {5}'.format((end_x-st_x)/2, 0, 0, end_y-st_y, (end_x-st_x)/2, 0);
    } else if (type == 2) {
      [s_ext_x,s_ext_y,s_p1_x,s_p1_y,s_p2_x,s_p2_y] = rotate_arrow_head(0,0,0,1,10);
      [e_ext_x,e_ext_y,e_p1_x,e_p1_y,e_p2_x,e_p2_y] = rotate_arrow_head(0,1,0,0,10);
      arr_path += ' l {0} {1} l {2} {3} l {4} {5}'.format(0,(end_y-st_y)/2, end_x-st_x, 0, 0, (end_y-st_y)/2);
    } else if (type == 3) {
      [s_ext_x,s_ext_y,s_p1_x,s_p1_y,s_p2_x,s_p2_y] = rotate_arrow_head(0,0,0,1,10);
      [e_ext_x,e_ext_y,e_p1_x,e_p1_y,e_p2_x,e_p2_y] = rotate_arrow_head(1,0,0,0,10);
      arr_path += ' l {0} {1} l {2} {3}'.format(0,end_y-st_y, end_x-st_x, 0);
    } else if (type == 4) {
      [infl_x,infl_y] = find_inflection_point (st_x,st_y,end_x,end_y,32,true);
      [s_ext_x,s_ext_y,s_p1_x,s_p1_y,s_p2_x,s_p2_y] = rotate_arrow_head(st_x,st_y,infl_x,infl_y,10);
      [e_ext_x,e_ext_y,e_p1_x,e_p1_y,e_p2_x,e_p2_y] = rotate_arrow_head(end_x,end_y,infl_x,infl_y,10);
      arr_path += ' Q {0} {1} {2} {3}'.format(infl_x,infl_y, end_x, end_y);
    } else if (type == 5) {
      [infl_x,infl_y] = find_inflection_point (st_x,st_y,end_x,end_y,32,false);
      [s_ext_x,s_ext_y,s_p1_x,s_p1_y,s_p2_x,s_p2_y] = rotate_arrow_head(st_x,st_y,infl_x,infl_y,10);
      [e_ext_x,e_ext_y,e_p1_x,e_p1_y,e_p2_x,e_p2_y] = rotate_arrow_head(end_x,end_y,infl_x,infl_y,10);
      arr_path += ' Q {0} {1} {2} {3}'.format(infl_x,infl_y, end_x, end_y);
    } else if (type == 6) {
      [infl_x,infl_y] = find_inflection_point (st_x,st_y,mid_x,mid_y,32,true);
      [s_ext_x,s_ext_y,s_p1_x,s_p1_y,s_p2_x,s_p2_y] = rotate_arrow_head(st_x,st_y,infl_x,infl_y,10);
      arr_path += ' Q {0} {1} {2} {3}'.format(infl_x,infl_y, mid_x, mid_y);
      [infl_x,infl_y] = find_inflection_point (mid_x,mid_y,end_x,end_y,32,false);
      [e_ext_x,e_ext_y,e_p1_x,e_p1_y,e_p2_x,e_p2_y] = rotate_arrow_head(end_x,end_y,infl_x,infl_y,10);
      arr_path += ' Q {0} {1} {2} {3}'.format(infl_x,infl_y, end_x, end_y);
    }  else if (type == 7) {
      [infl_x,infl_y] = find_inflection_point (st_x,st_y,mid_x,mid_y,32,false);
      [s_ext_x,s_ext_y,s_p1_x,s_p1_y,s_p2_x,s_p2_y] = rotate_arrow_head(st_x,st_y,infl_x,infl_y,10);
      arr_path += ' Q {0} {1} {2} {3}'.format(infl_x,infl_y, mid_x, mid_y);
      [infl_x,infl_y] = find_inflection_point (mid_x,mid_y,end_x,end_y,32,true);
      [e_ext_x,e_ext_y,e_p1_x,e_p1_y,e_p2_x,e_p2_y] = rotate_arrow_head(end_x,end_y,infl_x,infl_y,10);
      arr_path += ' Q {0} {1} {2} {3}'.format(infl_x,infl_y, end_x, end_y);
    } 
    //Add pointer to 'start' end of the arrow
    if ((pointer_type == 1) || (pointer_type == 3)) svg+= ' m {8} {9} l {0} {1} m {2} {3} l {4} {5} m {6} {7}'.format(s_p1_x,s_p1_y,-s_p1_x,-s_p1_y,s_p2_x,s_p2_y,-s_p2_x,-s_p2_y, -s_ext_x, -s_ext_y);
    //draw arrow line
    svg += arr_path;
    //Add pointer to 'end' end of the arrow
    if ((pointer_type == 2) || (pointer_type == 3)) svg+= ' m {8} {9} l {0} {1} m {2} {3} l {4} {5} m {6} {7}'.format(e_p1_x,e_p1_y,-e_p1_x,-e_p1_y,e_p2_x,e_p2_y,-e_p2_x,-e_p2_y, -e_ext_x, -e_ext_y);
    svg += ' " class="arrow" stroke="'+color+'" stroke-opacity="'+opacity+'"/></path>';
    svg += '<circle id="drag_'+i+'_arr_st" class="draggable arrow_drag" cx="'+(st_x)+'" cy="'+(st_y)+'" r="1"/>';
    svg += '<circle id="drag_'+i+'_arr_end" class="draggable arrow_drag" cx="'+(end_x)+'" cy="'+(end_y)+'" r="1"/>';  
    //Add the arrow text
    var text_width=get_text_width(text, '0.7rem');
    var x_loc = mid_x - text_width/2;
    svg += '<rect x="{0}" y="{1}" width="{2}" height="{3}" class="background_rect"/>'.format(x_loc-4,mid_y-8,text_width+8,16);
    svg += '<text x="{0}" y="{1}" class="arrow_text" fill="{2}">{3}</text>'.format(x_loc,mid_y+4,color,timing_diagram.arrows[i].text);
  }
  return svg;
}

function rotate_arrow_head (st_x,st_y,end_x,end_y,length) {
  var angle = 30 * 2 * Math.PI / 360;
  var p1_x,p1_y,p2_x,p2_y;
  var ext_x,ext_y;
  //first find angle from start to end
  var ang_st_2_end = Math.atan((end_y-st_y) / (end_x-st_x));
  if (st_x > end_x) ang_st_2_end += Math.PI;
  //calculate end of first arrow head line
  ext_x =Math.round(Math.cos(ang_st_2_end));
  ext_y =Math.round(Math.sin(ang_st_2_end));
  p1_x = Math.round(length * Math.cos(ang_st_2_end - angle));
  p1_y = Math.round(length * Math.sin(ang_st_2_end - angle));
  p2_x = Math.round(length * Math.cos(ang_st_2_end + angle));
  p2_y = Math.round(length * Math.sin(ang_st_2_end + angle));
  return [ext_x,ext_y,p1_x,p1_y,p2_x,p2_y];
}

//arcs are created by adding an inflection point which the start and the end of the arc point towards.
function find_inflection_point (st_x,st_y,end_x,end_y,length,flip) {
  var infl_x, infl_y;
  var deg_90 = 90 * 2 * Math.PI / 360;
  var flip_mx = flip ? -1 : 1;
  //find the angle of the inflection point and the x-y axis
  var theeta = flip_mx*deg_90 + Math.atan((end_y-st_y)/(end_x-st_x));
  var x_delta = length * Math.cos(theeta);
  var y_delta = length * Math.sin(theeta);
  infl_x = Math.round(st_x + x_delta + (end_x-st_x)/2);
  infl_y = Math.round(st_y + y_delta + (end_y-st_y)/2);
  return [infl_x, infl_y];
}

function createArray(length) {
  var arr = new Array(length || 0),
      i = length;

  if (arguments.length > 1) {
      var args = Array.prototype.slice.call(arguments, 1);
      while(i--) arr[length-1 - i] = createArray.apply(this, args);
  }

  return arr;
}


function initialise_grip_loc() {
  var i,j;
  var width = timing_diagram.total_width;
  var height = timing_diagram.total_height;
  grip_location = createArray(width, height);
  for (i=0;i<width; i++) {
    for (j=0;j<height; j++) {
      grip_location[i][j] = 0;
    }
  }
}

function redraw_svg() {
  resize_svg();
  initialise_grip_loc();
  inner_svg="";
  inner_svg += draw_annotations();
  inner_svg += draw_vertical_seperators(14);
  inner_svg += draw_row_labels_and_titles();
  inner_svg += draw_bricks();
  inner_svg += draw_arrow()
  inner_svg += draw_plus_minus_row()
  document.getElementById('main_svg').innerHTML = inner_svg;
}



function initialise() {
  //Adds the string.format prototype if it doesn't exist
  if (!String.prototype.format) {
    String.prototype.format = function() {
      var args = arguments;
      return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined'
          ? args[number]
          : match
        ;
      });
    };
  }
  draw_selectable_bricks();
  draw_control_panel('initial');
  redraw_svg();
}
