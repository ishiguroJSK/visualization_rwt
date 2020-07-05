$(function() {

  ROSLIB.Ros.prototype.getTopicsForType = function(type, callback) {
    var topicsForTypeClient = new ROSLIB.Service({
      ros : this,
      name : '/rosapi/topics_for_type',
      serviceType : 'rosapi/TopicsForType'
    });
    var request = new ROSLIB.ServiceRequest({
      type: type
    });
    topicsForTypeClient.callService(request, function(result) {
      callback(result.topics);
    });
  };
  
  ROSLIB.Ros.prototype.getTopicType = function(topic, callback) {
    var topicTypeClient = new ROSLIB.Service({
      ros : this,
      name : '/rosapi/topic_type',
      serviceType : 'rosapi/TopicType'
    });
    var request = new ROSLIB.ServiceRequest({
      topic: topic
    });
    topicTypeClient.callService(request, function(result) {
      callback(result.type);
    });
  };

  
  var ros = new ROSLIB.Ros();
  ros.install_config_button("config-button");

  ros.on("connection", function() {
    ros.getTopicsForType('sensor_msgs/Image', function(image_topics) {
      image_topics.sort();
      _.map(image_topics, function(topic) {
        $("#topic-select").append('<option value="' + topic + '">' + topic + "</option>");
      });
    });
  });

  ros.on("close", function() {
    $("#topic-select").empty();
  });

  ////// mouse move
  var mousemove_pub = new ROSLIB.Topic({
    ros : ros,
    name : '/xtion/rgb/image_raw/mousemove',
    messageType : 'geometry_msgs/PointStamped'
  });
  document.getElementById("canvas-area").addEventListener("mousemove", function(e){
    var clientRect = this.getBoundingClientRect();
    var canvasX    = e.clientX - clientRect.left;
    var canvasY    = e.clientY - clientRect.top;
    var scale      = 480.0 / $("#canvas-area").height();
    var imageX     = canvasX * scale;
    var imageY     = canvasY * scale;
    var mousemove = new ROSLIB.Message({
      header : { frame_id : "test" },
      point  : { x : imageX, y : imageY, z : 0.0 }
    });
    mousemove_pub.publish(mousemove);
    document.getElementById("debug-text-area1").innerText =
      "mouse move\n"+
      "- clicked point (2D image coordinate)  = "+ imageX    +", "+ imageY    +"\n"+
      "- clicked point (2D canvas coordinate) = "+ canvasX   +", "+ canvasY   +"\n"+
      "- clicked point (2D client coordinate) = "+ e.clientX +", "+ e.clientY +"\n\n";
  });

  ///// mouse click
  var screenpoint_pub = new ROSLIB.Topic({
    ros : ros,
    name : '/xtion/rgb/image_raw/screenpoint',
    messageType : 'geometry_msgs/PointStamped'
  });
  document.getElementById("canvas-area").addEventListener("click", function(e){
    var clientRect = this.getBoundingClientRect();
    var canvasX    = e.clientX - clientRect.left;
    var canvasY    = e.clientY - clientRect.top;
    var scale      = 480.0 / $("#canvas-area").height();
    var imageX     = canvasX * scale;
    var imageY     = canvasY * scale;
    var screenpoint = new ROSLIB.Message({
      header : { frame_id : "test" },
      point  : { x : imageX, y : imageY, z : 0.0 }
    });
    screenpoint_pub.publish(screenpoint);
    document.getElementById("debug-text-area2").innerText =
      "mouse click\n"+
      "- clicked point (2D image coordinate)  = "+ imageX    +", "+ imageY    +"\n"+
      "- clicked point (2D canvas coordinate) = "+ canvasX   +", "+ canvasY   +"\n"+
      "- clicked point (2D client coordinate) = "+ e.clientX +", "+ e.clientY +"\n\n";
  });

  ///// 3D point
  listener1 = new ROSLIB.Topic({
    ros : ros,
    name : '/pointcloud_screenpoint_nodelet/output_point',
    messageType : 'geometry_msgs/PointStamped'
  });
  listener1.subscribe(message => {
    document.getElementById("debug-text-area3").innerText =
      listener1.name + " = "+ message.point.x +", "+ message.point.y +", "+ message.point.z +"\n\n";
  });

  ///// larm ref
  listener2 = new ROSLIB.Topic({
    ros : ros,
    name : '/master_larm_pose',
    messageType : 'geometry_msgs/PoseStamped'
  });
  listener2.subscribe(message => {
    document.getElementById("debug-text-area4").innerText =
      listener2.name + " = "+ message.pose.position.x +", "+ message.pose.position.y +", "+ message.pose.position.z+"\n\n";
  });

  ///// rarm ref
  listener3 = new ROSLIB.Topic({
    ros : ros,
    name : '/master_rarm_pose',
    messageType : 'geometry_msgs/PoseStamped'
  });
  listener3.subscribe(message => {
    document.getElementById("debug-text-area5").innerText =
      listener3.name + " = "+ message.pose.position.x +", "+ message.pose.position.y +", "+ message.pose.position.z+"\n\n";
  });


  var init_base_x   = -0.1;
  var init_base_y   = -2.0;
  var init_base_yaw =  0.0;
  var setModelState = new ROSLIB.Service({
    ros : ros,
    name : '/gazebo/set_model_state',
    serviceType : 'gazebomsgs/SetModelState'
  });
  var init_request = new ROSLIB.ServiceRequest({
    model_state:{
      model_name: 'iiwa14d',
      pose:{
	position:{
	  x: init_base_x,
	  y: init_base_y,
	  z: 0.0
	},
	orientation:{
	  x: 0.0,
	  y: 0.0,
	  z: init_base_yaw,
	  w: 0.0
	}
      },
      twist:{
	linear:{
	  x: 0.0,
	  y: 0.0,
	  z: 0.0
	},
	angular:{
	  x: 0.0,
	  y: 0.0,
	  z: 0.0
	}
      }
    }
  });
  var request = new ROSLIB.ServiceRequest(init_request);
  
  $("#movebase-yaw-button").click(function(e) {
    e.preventDefault();
    request.model_state.pose.orientation.z = (request.model_state.pose.orientation.z == 0) ? 1 : 0;
    setModelState.callService(request, result => { console.log('Call ' + setModelState.name + 'rotate Z ? = ' + request.model_state.pose.orientation.z); });
  });

  $("#movebase-f-button").click(function(e) {
    e.preventDefault();
    request.model_state.pose.position.x += 0.1;
    setModelState.callService(request, result => { console.log('Call ' + setModelState.name ); });
  });

  $("#movebase-b-button").click(function(e) {
    e.preventDefault();
    request.model_state.pose.position.x -= 0.1;
    setModelState.callService(request, result => { console.log('Call ' + setModelState.name ); });
  });

  $("#movebase-l-button").click(function(e) {
    e.preventDefault();
    request.model_state.pose.position.y += 0.1;
    setModelState.callService(request, result => { console.log('Call ' + setModelState.name ); });
  });

  $("#movebase-r-button").click(function(e) {
    e.preventDefault();
    request.model_state.pose.position.y -= 0.1;
    setModelState.callService(request, result => { console.log('Call ' + setModelState.name ); });
  });

  $("#reset-sim-button").click(function(e) {
    e.preventDefault();
    var resetWorld = new ROSLIB.Service({
      ros : ros,
      name : '/gazebo/reset_world',
      serviceType : 'std_srcs/Empty'
    });
    request = $.extend(true, {}, init_request);
    var request1 = new ROSLIB.ServiceRequest();
    resetWorld.callService(request1, result => { console.log('Call ' + setModelState.name); });
  });




    

    
  $("#larm-button").click(function(e) {
    var $button = $(this);
    e.preventDefault();

    var screen_point_pub = new ROSLIB.Topic({
      ros : ros,
      name : '/xtion/rgb/image_raw/screenpoint',
      messageType : 'geometry_msgs/PointStamped'
    });
  
    var screen_point = new ROSLIB.Message({
      header : {
        frame_id : "testaaa"
      },
      point : {
        x : Math.random()*320,
        y : Math.random()*480,
        z : 0.0
      }
    });
    screen_point_pub.publish(screen_point);
  });


    
  $("#rarm-button").click(function(e) {
    var $button = $(this);
    e.preventDefault();

    var screen_point_pub = new ROSLIB.Topic({
      ros : ros,
      name : '/xtion/rgb/image_raw/screenpoint',
      messageType : 'geometry_msgs/PointStamped'
    });
  
    var screen_point = new ROSLIB.Message({
      header : {
        frame_id : "testaaa"
      },
      point : {
        x : Math.random()*320 + 320,
        y : Math.random()*480,
        z : 0.0
      }
    });
    screen_point_pub.publish(screen_point);
  });


  var mjpeg_canvas = null;
  var current_image_topic = null;
  $("#topic-form").submit(function(e) {
    if (mjpeg_canvas) {
      // remove the canvas here
      mjpeg_canvas = null;
      $("#canvas-area canvas").remove();
    }
    e.preventDefault();
    var topic = $("#topic-select").val();
    // first of all, subscribe the topic and detect the width/height
    var div_width = $("#canvas-area").width();
    current_image_topic = topic;
    mjpeg_canvas = new MJPEGCANVAS.Viewer({
      divID : "canvas-area",
      host : ros.url().hostname,
      topic : topic,
      quality : 50,
      width: div_width,
      height: 480 * div_width / 640.0
    });
    return false;
  });

  var recordingp = false;
  $("#record-button").click(function(e) {
    var $button = $(this);
    e.preventDefault();
    if (current_image_topic) {
      if (!recordingp) {
        var rosbagClient = new ROSLIB.Service({
          ros : ros,
          name : '/rosbag_record',
          serviceType : 'rwt_image_view/RosbagRecordRequest'
        });
        var request = new ROSLIB.ServiceRequest({
          topics: [current_image_topic]
        });
        rosbagClient.callService(request, function(result) {
          recordingp = true;
          $button.removeClass("btn-success")
            .addClass("btn-danger")
            .html("stop recording");
          // download
          
        });
      }
      else {
        recordingp = false;
        var rosbagClient = new ROSLIB.Service({
          ros : ros,
          name : '/rosbag_record_stop',
          serviceType : 'std_srvs/Empty'
        });
        var request = new ROSLIB.ServiceRequest({});
        rosbagClient.callService(request, function(result) {
          // download here
          //var $alert = $('');
          var html = '<div class="alert alert-info alert-dismissable" id="download-alert">\
          <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>\
          <a class="alert-link" href="/rwt_image_view/tmp.bag">download the bagfile from here via right-click</a>\
</div>';
          //$button.html('<a href="/rwt_image_view/tmp.bag">download</a>');
          $("#topic-area").before(html);
          $button.removeClass("btn-danger")
            .addClass("btn-success")
            .html("record");  
        });
      }
    }
  });
  
});
