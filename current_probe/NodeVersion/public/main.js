var i_na=0;
var i_ua=0;
var i_ma=0;
var i_offset=0;
var t_offset=0;
var samples_per_grid = 10;
var grids_per_graph = 10;
var samples_per_data_point = 1;
var time_unit = 10000e-6;
var grid_width = 10e-3;
var fps = 5;
var total_points = samples_per_grid * grids_per_graph;
//var last_result_time=0;

var y_scaler=1;

var samples = 20;
var speed = 1000;
var values_high = [];
var values_low = [];
var labels = [];
var charts = [];
var value = 1;
var scale = 1;
var unplotted_array = [];
var next_unplotted_array = [];
var i=0;
var result_time=0;
var result_data=0;
var result_high=0;
var result_low=0;
var y_offset = 0;
var next_result_time = 0;

var connections = "";          // list of connections to the server

var socket = new WebSocket("ws://localhost:8081");  //opens a socket

var result_multiplier = 0;
var result_offset = 0;
var res = 0.1

var extended_results = [];

var auto_ranging = false;

var res_value = 0;


/*MUST ADD SOME DEBUG, WHAT IF THE SOCKET DIDN'T OPEN, OR THE RESET DOESN'T WORK?*/
function refresh_npm(){
  if (socket.readyState === WebSocket.OPEN)  {
    console.log("refreshing");
    socket.send("refresh");
    next_result_time=0;
  }
  i_na=0;
  i_ua=0;
  i_ma=0;
  $('#knob_y_offset_ma').val(0).trigger('change');
  $('#knob_y_offset_ua').val(0).trigger('change');
  $('#knob_y_offset_na').val(0).trigger('change');
  $('#knob_time_scale').val(0).trigger('change');
  $('#knob_y_scale').val(0).trigger('change');
  document.getElementById("com_status").innerHTML="COM CLOSED";
}

socket.onconnection=onconnection;
socket.onopen=onopen;
socket.onmessage = showData; // when a client sends a message,
socket.onclose=onclose;
socket.onerror =onerror;

function onconnection() { 
  console.log("New Connection"); 
};
function onopen() { 
  console.log("Socket has been opened, yay!!")
  document.getElementById("node_status").innerHTML="Connected";
  //check if user defined a COM port before - connect to previous port
  refresh_npm()
};
function onclose() { // when a client closes its connection
  console.log("connection closed"); // print it out
  document.getElementById("node_status").innerHTML="Closed";
  $.notify("Disconnected from Node...", "warn");
};

function onerror(evt) {
  $.notify("Failed to connect to Node...\n" + evt, "error");
};

// a function to toggle connection to Node. opens and closes the websocket
function connect_to_node() {
  if (socket.readyState === WebSocket.OPEN)  {
    socket.close();
  } else {
    //socket.close();
    socket = new WebSocket("ws://localhost:8081");  //opens a socket
    socket.onconnection=onconnection;
    socket.onopen=onopen;
    socket.onmessage = showData; // when a client sends a message,
    socket.onclose=onclose  
    socket.onerror=onerror;
  }
}

function select_com(com_id) {
  console.log("Connecting to " + com_id);
  socket.send("COM,"+com_id);
}

function auto_range() {
  $('#knob_time_scale').val(6).trigger('change');
  var range = Math.max(result_high - result_low,200);
  var y_min = Math.max(0,result_low-(range/2));

  // !! TO DO //
  // In the future the scale and offset should just be triggering knob changes, so that the knobs capture the correct 
  // values and code is not repeated
  var y_scale = 2 * range;
  charts.forEach(function(chart) {
    chart.options.scales.yAxes=
    [{
      ticks: {
        max: y_min+ (5*range),
        min: y_min
      }
    }];
  });
}

function showData(result) {
  // when the server returns, show the result in the div:
  //console.log(result.data);
  split_results=result.data.split(',');
  //console.log("Sensor reading:" + split_results);
  if (split_results[0]=="COM"){
    if (split_results[1]=="OPEN") {
      document.getElementById("com_status").innerHTML="COM OPEN a";
    } else if (split_results[1]=="CLOSED") {
      document.getElementById("com_status").innerHTML="COM CLOSED a";
    } else {
      console.log("GOT A LIST OF COM PORTS",split_results);
      var select = document.getElementById("COM_list");
      select.innerHTML="";
      split_results[0] = "SELECT A COM"
      for(var i=0; i<split_results.length;i++) {
        opt=document.createElement('option');
        opt.value=split_results[i];
        opt.innerHTML = split_results[i]; // whatever property it has
        // then append it to the select element
        select.appendChild(opt);
      }
    }
  } else {
    result_time = Number(split_results[0]);
    var result_data = new Uint16Array(1);
    //uint16[0] = 42;
    result_data[0] = split_results[1]; 
    //console.log("sensor raw data:",result_time,result_data[0]);

    //Divide voltage by fixed gain of 100 and also by resistor value (set as 100 here). Then scale it to the analog input voltage
    var result_i =  (result_multiplier * result_data[0]) - result_offset;

    //add new data to next array
    unplotted_array.push({
      d:result_i,
      t:result_time
    });
    //console.log("pushing data to array", unplotted_array);

    if (result_time >= next_result_time) {

      //add data to the to be plotted arrat
      add_to_plot(unplotted_array);
      unplotted_array = [];

     // last_result_time = result_time;
      next_result_time = result_time + samples_per_data_point
    }
  }
}

function add_to_plot(unplotted_array) {
 // console.log(unplotted_array);

  //save the data for freeze reformatting
  extended_results.unshift(unplotted_array)
  extended_results.pop();

  //plot the data
  unplotted_array.sort(function(a, b){
    return a.d - b.d;
  });
  result_high = unplotted_array[0].d;
  result_low = unplotted_array[unplotted_array.length-1].d;

  //--!!! Is the length checking necessary here? Should alsways shift in and then shift out right?
  values_high.unshift({
    x: result_time/samples_per_data_point,
    y: result_high
  });
  values_low.unshift({
    x: result_time/samples_per_data_point,
    y: result_low
  });
  if (values_high.length>total_points) {
    values_high.pop();
  }
  if (values_low.length>total_points) {
    values_low.pop();
  }

  //Do some auto ranging - CHANGE THE CHECKED BOX
  if (auto_ranging) {
    if (result_high > 15000) {
      if      (res_value==0) res_value = 1;
      else if (res_value==1) res_value = 2;
    } else if (result_low < 10) {
      if      (res_value==2) res_value = 1;
      else if (res_value==1) res_value = 0;
    }

    var radios = document.getElementsByName('chose_r');
    for (var i = 0, length = radios.length; i < length; i++) {
      if (radios[i].value == res_value) {
        radios[i].checked = true;
      } else {
        radios[i].checked = false;
      }
    } 
    change_r();
  }
}

//When the user changes a knob, clear the results array and change the axes
function update_settings () {

  // res * 100 is resistor * gain of current amp
  result_multiplier = y_scaler * (1.8 / 32768)  / (res * 100);
  result_offset = y_offset * y_scaler;

  samples_per_data_point = (grid_width / samples_per_grid) / time_unit;
  console.log("samples per dp = ",samples_per_data_point);

  //flatten the extended results array. extended results is formatted in chunks so that it's length is easily maintained.
  var temp_extended_results = [];
  for (var i=0; i<extended_results.length; i++) {
    for (var j=0; j<extended_results[i].length; j++) {
      temp_extended_results.unshift(extended_results[i][j])
    }
  }

  // !!! Finish this later, it's so unimprotant right now...
  
  for (i=0;i<=total_points;i++){
    values_high.push({
      x: i,
      y: 0
    });
    values_low.push({
      x: i,
      y: -0.1
    });
    labels.push(i)
  }

}

var options = {
  events: [],
  animation: {
      duration: 0, // general animation time
  },
  hover: {
      animationDuration: 0, // duration of animations when hovering an item
  },
  responsiveAnimationDuration: 0, // animation duration after a resize
  responsive: true,
  legend: false,
  scales: {
    xAxes: [{
      display: true,
      gridlines:{
        display:true,
      },
      ticks: {
        display:true,
        maxTicksLimit:10,
        stepSize:1,
        min:0,
        max:100,
        precision:0,
        beginAtZero:true
      }
    }],
    yAxes: [{
      ticks: {
        max: 7,
        min: 0
      }
    }]
  }
}

function initialize() {

  $('#knob_y_scale').val(21).trigger('change');

  update_settings ();

  speed = 1000 / fps; //time between plots in ms

  for (i=0;i<=total_points;i++){
    labels.push(i)
  }


  charts.push(new Chart(document.getElementById("chart0"), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        data: values_high,
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 2,
        lineTension: 0,
        pointRadius: 0,
        fill: '+1'
      },{
        data: values_low,
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 2,
        lineTension: 0,
        pointRadius: 0,
        fill: '-1'
      }]
    },
    options: options,
  }));
}

function updateCharts(){
  charts.forEach(function(chart) {
    chart.update();
  });
}


function advance() {
  updateCharts();
  
  setTimeout(function() {
	  advance();
  }, speed);
}

function update_time_scale(value) {
  console.log("Time scaler is: " + time_scale_options[value].mx);
  grid_width=time_scale_options[value].mx;
  update_settings ()
}

function update_y_scale(value) {
  console.log("Y scaler is: " + y_scale_options[value].mx);
  y_scaler = y_scale_options[value].mx;
  update_settings();
}

function update_y_offset() {
  y_offset = (i_na/1e9) + (i_ua/1e6) + (i_ma/1e3);
  console.log("Y offset is: " + y_offset + "A");
  update_settings();
  /*charts.forEach(function(chart) {
    chart.options.scales.yAxes=
    [{
      ticks: {
        max: 70000+y_offset,
        min: y_offset
      }
    }];
  });*/

}

var time_scale_options = [
  {text:'5ms',  mx:5e-3},
  {text:'10ms', mx:1e-2},
  {text:'20ms', mx:2e-2},
  {text:'50ms', mx:5e-2},
  {text:'100ms',mx:1e-1},
  {text:'200ms',mx:2e-1},
  {text:'500ms',mx:5e-1},
  {text:'1s',   mx:1},
  {text:'2s',   mx:2},
  {text:'5s',   mx:5},
  {text:'10s',  mx:1e1},
  {text:'5ms',  mx:5e1},
];

var y_scale_options = [
  {text:'10n',  mx:1e8},
  {text:'20n',  mx:5e7},
  {text:'50n',  mx:2e7},
  {text:'100n', mx:1e7},
  {text:'200n', mx:5e6},
  {text:'500n', mx:2e6},
  {text:'1u',   mx:1e6},
  {text:'2u',   mx:5e5},
  {text:'5u',   mx:2e5},
  {text:'10u',  mx:1e4},
  {text:'20u',  mx:5e4},
  {text:'50u',  mx:2e4},
  {text:'100u', mx:1e4},
  {text:'200u', mx:5e3},
  {text:'500u', mx:2e3},
  {text:'1m',   mx:1e3},
  {text:'2m',   mx:5e2},
  {text:'5m',   mx:2e2},
  {text:'10m',  mx:1e2},
  {text:'20m',  mx:5e1},
  {text:'50m',  mx:2e1},
  {text:'100m', mx:1e1},
  {text:'10n',  mx:1e8},
]


/*Draw the time-scale selector knob*/
$(function() {
  $("#knob_time_scale").knob({
    fgColor:"#222222",
    width:150,
    cursor:20,
    min:0,
    max:11,
    height:150,
    thickness:.3,
    displayPrevious:true,
    release: function(v) {update_time_scale(v)},
    draw: function() { $(this.i).css('font-size', '22px'); },
    format : function (value) { return time_scale_options[value].text; }
  });
});

/*Draw the y-scale selector knob*/
$(function() {
  $("#knob_y_scale").knob({
    fgColor:"#222222",
    width:150,
    cursor:20,
    min:0,
    max:22,
    height:150,
    thickness:.3,
    displayPrevious:true,
    release: function(v) {update_y_scale(v)},
    draw: function() { $(this.i).css('font-size', '22px'); },
    format : function (value) { return y_scale_options[value].text; }
  });
});

/*Draw the y-offset selector knobs*/
$(function() {
  var old_val=0;
  var old_old_val=0
  $("#knob_y_offset_ma").knob({
    fgColor:"#222222",
    width:85,
    cursor:20,
    min:0,
    max:20,
    height:85,
    thickness:.3,
    stopper:false,
    displayPrevious:true,
    //displayPrevious:true,
    release: function(value) {
      if((i_ma==0) && (value!=0)) this.val(0).trigger('change');
      update_y_offset()
    },
    draw: function() { $(this.i).css('font-size', '14px'); },
    format: function (value) {
      if ((value>old_val) && (old_val>old_old_val)) {
        if(i_ma<990) i_ma=i_ma+10;
      } else if ((value<old_val) && (old_val<old_old_val)) {
        if(i_ma>0) i_ma=i_ma-10;
       // i_ma=check_dec(i_ma)
       // i=i-10;
      }
      if (value != old_val) {
        old_old_val = old_val;  
        old_val = value;
      }
      return i_ma + 'mA';
    }
  });
});
$(function() {
  var old_val=0;
  var old_old_val=0
  $("#knob_y_offset_ua").knob({
    fgColor:"#222222",
    width:85,
    cursor:20,
    min:0,
    max:20,
    height:85,
    thickness:.3,
    stopper:false,
    displayPrevious:true,
    //displayPrevious:true,
    release: function(value) {
      if((i_ua==0) && (value!=0)) this.val(0).trigger('change');
      update_y_offset()
    },
    draw: function() { $(this.i).css('font-size', '14px'); },
    format: function (value) {
      if ((value>old_val) && (old_val>old_old_val)) {
        if(i_ua<990) i_ua=i_ua+10;
      } else if ((value<old_val) && (old_val<old_old_val)) {
        if(i_ua>0) i_ua=i_ua-10;
        //i_ua=check_dec(i_ua);
      }
      if (value != old_val) {
        old_old_val = old_val;  
        old_val = value;
      }
      return i_ua + 'uA';
    }
  });
});
$(function() {
  var old_val=0;
  var old_old_val=0
  $("#knob_y_offset_na").knob({
    fgColor:"#222222",
    width:85,
    cursor:20,
    min:0,
    max:20,
    height:85,
    thickness:.3,
    displayPrevious:true,
    stopper:false,
    //displayPrevious:true,
    release: function(value) {
      if((i_na==0) && (value!=0)) this.val(0).trigger('change');
      update_y_offset()
    },
    draw: function() { $(this.i).css('font-size', '14px'); },
    format: function (value) {
      if ((value>old_val) && (old_val>old_old_val)) {
        if(i_na<990) i_na=i_na+10;
      } else if ((value<old_val) && (old_val<old_old_val)) {
        if(i_na>0) i_na=i_na-10;
        //i_na = check_dec(i_na);
      }
      if (value != old_val) {
        old_old_val = old_val;  
        old_val = value;
      }
      return i_na + 'nA';
    }
  });
});


$(function() {
  var old_val=0;
  var old_old_val=0
  var twists = 0;
  var twists_before_step_increase = 10;
  var step_size = 0;
  $("#knob_y_offset").knob({
    fgColor:"#222222",
    width:85,
    cursor:20,
    min:0,
    max:20,
    height:85,
    thickness:.3,
    displayPrevious:true,
    stopper:false,
    //displayPrevious:true,
    release: function(value) {
      twists = 0;
      if((i_offset<=0) && (value!=0)) this.val(0).trigger('change');
      update_y_offset()
    },
    draw: function() { $(this.i).css('font-size', '14px'); },
    format: function (value) {
      var start_resolution = 1/(10*y_scaler);
      step_size = start_resolution * Math.pow(10,Math.floor(twists/twists_before_step_increase));
      console.log(twists,step_size)
      //step_size = step_size;
      if ((value>old_val) && (old_val>old_old_val)) {
        i_offset=i_offset+step_size;
        if(i_offset>=1) i_offset = 1;
        twists = twists + 1;
      } else if ((value<old_val) && (old_val<old_old_val)) {
        if(i_offset>0) i_offset=i_offset-step_size;
        twists = twists + 1;
      }
      if (value != old_val) {
        old_old_val = old_val;  
        old_val = value;
      }
      if (i_offset < 1e-6)      return Math.round(i_offset*1e9) + 'nA';
      else if (i_offset < 1e-3) return Math.round(i_offset*1e6) + 'uA';
      else                      return Math.round(i_offset*1e3) + 'mA';
    }
  });
});

$(function() {
  var old_val=0;
  var old_old_val=0
  var twists = 0;
  var twists_before_step_increase = 10;
  var step_size = 0;
  $("#knob_x_offset").knob({
    fgColor:"#222222",
    width:85,
    cursor:20,
    min:0,
    max:20,
    height:85,
    thickness:.3,
    displayPrevious:true,
    stopper:false,
    //displayPrevious:true,
    release: function(value) {
      twists = 0;
      if((t_offset<=0) && (value!=0)) this.val(0).trigger('change');
      update_y_offset()
    },
    draw: function() { $(this.i).css('font-size', '14px'); },
    format: function (value) {
      var start_resolution = grid_width/10;
      step_size = start_resolution * Math.pow(10,Math.floor(twists/twists_before_step_increase));
      console.log(twists,step_size)
      //step_size = step_size;
      if ((value>old_val) && (old_val>old_old_val)) {
        t_offset=t_offset+step_size;
        if(t_offset>=1) t_offset = 1;
        twists = twists + 1;
      } else if ((value<old_val) && (old_val<old_old_val)) {
        if(t_offset>0) t_offset=t_offset-step_size;
        twists = twists + 1;
      }
      if (value != old_val) {
        old_old_val = old_val;  
        old_val = value;
      }
      if (grid_width < 1e-3)      return Math.round(t_offset*1e6) + 'us';
      if (grid_width < 1)         return Math.round(t_offset*1e3) + 'ms';
      else                        return Math.round(t_offset) + 's';
    }
  });
});

function check_dec(val) {
  if (((i_ma*100000) + (i_ua*1000) + i_na) >= 0){
    return val;
  } else {
    console.log("Your number is below 0")
    return val+10;
  }
}

function change_r() {
  // !!! CHECK IF ARDUINO IS LISTENING HERE
  var radios = document.getElementsByName('chose_r');
  for (var i = 0, length = radios.length; i < length; i++) {
    if (radios[i].checked) {
      var res_value = radios[i].value;
      break;
    }
  } 

  function change_auto_r() {
    auto_ranging = !auto_ranging;
  }

  socket.send("res," + res_value);

  if (res_value == 0) res = 0;
  else if (res_value == 1) res = 1;
  else if (res_value == 2) res = 100;
  console.log("changing resistor setting to " + res_value);
}

function change_display() {
  // !!! CHECK IF ARDUINO IS LISTENING HERE
  var radios = document.getElementsByName('change_display');
  for (var i = 0, length = radios.length; i < length; i++) {
    if (radios[i].checked) {
      var value = radios[i].value;
      break;
    }
  } 
  if (value == 0) { //continuous. Tell arduino to start sending data
    socket.send("res," + 3);
  } else {  //frozen
    socket.send("res," + 4);
  }
}


window.onload = function() {
  initialize();
  advance();
};



