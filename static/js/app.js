

// Sunburst plot

// Sunburst Dimensions
var width = 600;
var height = 600;
var radius = Math.min(width, height) / 2;

radius = radius - 30;

// Breadcrumb dimensions: width, height, spacing, width of tip/tail
var b = {
  w: 75, h: 30, s: 3, t: 10
};

// Total size of all segments, to be set later
var totalSize = 0;

// Set up the shape
var vis = d3.select("#chart").append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .append("svg:g")
    .attr("id", "container")
    .attr("transform", `translate(${width/2}, ${(height/2) - 25})`);

// Drawing Partition and Arcs

var partition = d3.partition()
    .size([2 * Math.PI, radius * radius]);

var arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => Math.sqrt(d.y0))
    .outerRadius(d => Math.sqrt(d.y1));


// Set up the data

d3.text("data/Sun_Dummy.csv").then(function(text){
  var csv = d3.csvParseRows(text);
  var json = buildHierarchy(csv);
  console.log(json);
  // colors in here, because they require the segmentNames array
  var colors = {};
  d3.json("data/colorPalette.json").then(function(colorpad){
    for (w=0; w<json.segmentNames.length; w++){
      colors[json.segmentNames[w]] = colorpad[w].value;
    }
    console.log(colors);
    json = mapColors(json.root, colors);
    TwoD_Plotter(colors).then( (twoDdata) => createVisualization(twoDdata, json, colors));
    // here we need the .then, but then how do you send twoDdata in the .then
  });
});

//  Event functions

function mouseover2D() {
  d3.select(this)
    .transition()
    .duration( 1000 )
    .attr("opacity", "1")
    .attr("stroke-width", "5px")
    .attr("r", "50px");
}

function mouseout2D() {
  d3.select(this)
    .transition()
    .duration( 1000 )
    .attr("opacity", "0.6")
    .attr("stroke-width", "1px")
    .attr("r", "15px");
}


function TwoD_Plotter(colors){
  // SVG set up
  var svgHeight = 600;
  var svgWidth = 600;

  // Chart Margins
  var chartMargin = {
    top: 40,
    right: 40,
    bottom: 40,
    left: 40
  };

  console.log(colors);

  // Chart Dimensions
  var chartHeight = svgHeight - chartMargin.top - chartMargin.bottom;
  var chartWidth = svgWidth - chartMargin.left - chartMargin.right;

  var quadTitles = [
    {name: "Consolidate", x: 10, y: 10},
    {name: "Optimize", x: (chartWidth - 150), y: 10},
    {name: "Refresh/Replace", x: (chartWidth - 150), y: (chartHeight - 10)},
    {name: "Eliminate", x: 10, y: (chartHeight -10)}
  ];

  // SVG append
  var svg1 = d3.select("#svg-area")
    .append("svg")
    .attr("height", svgHeight)
    .attr("width", svgWidth);

  // G append
  var chartGroup = svg1.append("g")
    .attr("transform", `translate(${chartMargin.left}, ${chartMargin.top})`);

  return d3.json("data/data.json").then(function(data, error){
    if (error) throw error;

    // scales
    var xScale = d3.scaleLinear()
      .domain([0, 1])
      //.domain(d3.extent(data, d => d.xScore))
      .range([0, chartWidth]);

    var yScale = d3.scaleLinear()
      .domain([0, 1])
      //.domain(d3.extent(data, d => d.yScore))
      .range([chartHeight, 0]);

    console.log(data);

    var aScale = d3.scaleSqrt()
      .domain([0, d3.max(data, d => d.cost)])
      .range([10, 50]);

    // axes
    var xAxis = d3.axisBottom(xScale).tickValues([0, 0.5, 1]);
    var yAxis = d3.axisLeft(yScale).tickValues([0, 1]);

    // Gradients
    var grads = svg1.append("defs").selectAll("radialGradient")
      .data(data)
      .enter()
      .append("radialGradient")
      .attr("gradientUnits", "objectBoundingBox")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", "100%")
      .attr("id", function(d, i) { return "grad" + i; });

    grads.append("stop")
        .attr("offset", "0%")
        .style("stop-color", "white");

    grads.append("stop")
        .attr("offset", "100%")
        .style("stop-color", function(d, i) { return colors[d.name]; });
        // COLORS I isn't correct - should be colors[d.name]

    // Append circles to chart Group
    chartGroup.selectAll("circle")
      .data(data)
      .enter()
      .append('circle')
      .attr("class", d => d.name)
      .attr("cx", d => xScale(d.xScore))
      .attr("cy", d => yScale(d.yScore))
      .attr("r", d => aScale(d.cost))
      .attr("fill", function (d, i){ return "url(#grad" + i + ")" })
      // function(d, i){
      //   return colors[i];
      // })
      .attr("stroke", "#fff")
      .attr("stroke-width", "1px")
      //.attr("opacity", "0.75")
      .on("mouseover", mouseover2D)
      .on("mouseout", mouseout2D);

    // Label the circles
    chartGroup.append("g")
      .selectAll("text")
      .data(data)
      .enter()
      .append("text")
      .text(d => d.name)
      .attr("x", d => xScale(d.xScore) + aScale(d.cost))
      .attr("y", d => yScale(d.yScore) - aScale(d.cost))
      .attr("fill", "#fff")
      .attr("font-weight", "bold");
      //.attr("color", "#fff");

    // Call Axes
    chartGroup.append("g")
      .attr("transform", `translate(0, ${chartHeight / 2})`)
      .call(xAxis)
      .attr("fill", "#fff")
      .attr("stroke", "#fff");

    chartGroup.append("g")
      .attr("transform", `translate(${chartWidth / 2}, 0)`)
      .call(yAxis)
      .attr("fill", "#fff")
      .attr("stroke", "#fff")
      .attr("stroke-width", "0.5px");

    // Add four quadrant titles
    chartGroup.append("g")
      .selectAll("text")
      .data(quadTitles)
      .enter()
      .append("text")
      .text(d => d.name)
      .attr("font-size", "20px")
      .attr("fill", "#fff")
      .attr("font-weight", "bold")
      .attr("x", d => d.x)
      .attr("y", d => d.y);

    // Axis titles
    chartGroup.append("text")
      .attr("transform", `translate(${chartWidth/2}, ${svgHeight-chartMargin.bottom-10})`)
      .style("text-anchor", "middle")
      .text("Mission Criticality")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .attr("fill", "#ffffff");

    chartGroup.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - chartMargin.left)
      .attr("x", 0 - (chartHeight/2))
      .attr("dy", "1em")
      //.attr("transform", `translate(${chartMargin.left-10}, ${chartHeight/2})`)
      .style("text-anchor", "middle")
      .text("Ease of Sustainability")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .attr("fill", "#ffffff"); // not working

    svg1.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", svgHeight)
      .attr("width", svgWidth)
      .style("stroke", "#fff")
      .style("fill", "none")
      .style("stroke-width", "1px");

  });

}

// Function to create the visualization
function createVisualization(twoDdata, json, colors) {
  var d = json;
  console.log(twoDdata); // how is this working if twoDdata is undefined?
  // console.log(d);
  // console.log(colors);
  // Basic setup of page elements
  initializeBreadcrumbTrail();
  drawLegend(colors);
  d3.select("#togglelegend").on('click', toggleLegend);

  // Bounding circle underneath sunburst when mouse leaves parent
  vis.append("svg:circle")
      .attr("r", radius)
      .style("opacity", 0);

  // Turn data into a d3 hierarchy and calculate sums
  var root = d3.hierarchy(json)
      .sum(d => d.users)
      .sort(function(a, b) { return b.value - a.value });

  // Filter the nodes to only keep those large enough to see
  var nodes = partition(root).descendants()
      .filter(d => d.x1 - d.x0 > 0.005);

  var path = vis.data([json]).selectAll("path")
      .data(nodes)
      .enter()
      .append("svg:path")
      .attr("display", d => d.depth ? null : "none")
      .attr("d", arc)
      .attr("fill-rule", "evenodd")
      .style("fill", d => d.data.color) // ** right here is the color problem
      .style("opacity", 1)
      .on("mouseover", mouseoverSun);

  // Add mouseleave handler to bounding circle
  d3.select("#container").on("mouseleave", mouseleave);

  // Get total size of the tree = value of root note from Partition
  totalSize = path.datum().value;

  // console.log(d3.select("#svg-area svg g"));
  //
  // const twoD_circles = d3.select("#svg-area svg g")
  //                       .selectAll("circle")
  //                       .data(twoDdata);
  //
  // console.log(twoD_circles);

  d3.selectAll("circle").on('click', function(){
    console.log("clicked!");
    // console.log(d3.select("#svg-area svg g circle"));
    var app = d3.select( this ).attr('class');
    var my_nodes = [];
    for (var q = 1; q < nodes.length; q++){
      if(nodes[q].data.name == app){
        my_nodes.push(nodes[q]);
      }
    }
    console.log(my_nodes);

    vis.selectAll("path")
        .transition()
        .duration( 1000 )
        .style("opacity", 0.3);

    vis.selectAll("path")
        .filter(function(nodes){
            return (my_nodes.includes(nodes));
          })
        .transition()
        .duration( 1000 )
        .style("opacity", 1);

    ps_value = 0;
    for (var j=0; j<my_nodes.length; j++){
      ps_value += my_nodes[j].data.users;
    }
    var percentage_sum = (100 * ps_value / totalSize).toPrecision(3);
    var percentageString = percentage_sum + "%";
    d3.select("#percentage")
      .text(percentageString);

    d3.select("#name")
      .text(app);

    d3.select("#explanation")
      .style("visibility", "");
  })
};

// MOUSEOVER //
function mouseoverSun(d){
  var percentage = (100 * d.value / totalSize).toPrecision(3);
  var percentageString = percentage + "%";
  if (percentage < 0.1) {
    percentageString = "< 0.1%";
  }

  d3.select("#percentage")
    .text(percentageString);

  d3.select("#name")
    .text(d.data.name);

  d3.select("#explanation")
    .style("visibility", "");

  var sequenceArray = d.ancestors().reverse();
  sequenceArray.shift(); // remove root node from the nodeArray
  updateBreadcrumbs(sequenceArray, percentageString);

  // Fade all segments
  d3.selectAll("path")
      .style("opacity", 0.3);

  // Highlight only those that are ancestor of current segment
  vis.selectAll("path")
      .filter(function(node) {
        return (sequenceArray.indexOf(node) >= 0);
      })
      .style("opacity", 1);
}

// MOUSELEAVE //
function mouseleave(d){
  // Hide breadcrumb trail
  d3.select("#trail")
    .style("visibility", "hidden");

  // Deactivate all segments during transition
  d3.selectAll("path").on("mouseover", null);

  // Transition each segment to full opacity and then reactivate
  d3.selectAll("path")
    .transition()
    .duration( 1000 )
    .style("opacity", 1)
    .on("end", function(){
        d3.select(this).on("mouseover", mouseoverSun)
    });

  d3.select("#explanation")
    .style("visibility", "hidden");
}

// Breadcrumb Trail //
function initializeBreadcrumbTrail(){
  // Add svg area
  var trail = d3.select("#sequence").append("svg:svg")
      .attr("width", width)
      .attr("height", 50)
      .attr("id", "trail");

  trail.append("svg:text")
      .attr("id", "endlabel")
      .style("fill", "#fff");
}

function breadcrumbPoints(d, i){
  var points = [];
  points.push("0,0");
  points.push(b.w + ",0");
  points.push(b.w + b.t + "," + (b.h / 2));
  points.push(b.w + "," + b.h);
  points.push("0," + b.h);
  if (i > 0) {
    points.push(b.t + "," + (b.h/2));
  }
  return points.join(" ");
}

function updateBreadcrumbs(nodeArray, percentageString){
  // Data join; key function combines name and depth (=position in sequence)
  var trail = d3.select("#trail")
      .selectAll("g")
      .data(nodeArray, d => d.data.name + d.depth);

  // Remove exiting nodes
  trail.exit().remove()

  // Add breadcrumbs and label for entering nodes
  var entering = trail.enter().append("svg:g");

  entering.append("svg:polygon")
      .attr("points", breadcrumbPoints)
      .style("fill", d => d.data.color);

  entering.append("svg:text")
      .attr("x", (b.w + b.t) / 2)
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(d => d.data.name);

  // Merge enter and update selection; set position for all nodes
  entering.merge(trail)
      .attr("transform", function(d, i){
        return `translate(${i * (b.w + b.s)}, 0)`;
      });

  d3.select("#trail").select("#endLabel")
    .attr("x", (nodeArray.length + 0.5) * (b.w + b.s))
    .attr("y", b.h / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .text(percentageString);

  // Make the breadcrumb trail visible, if hidden
  d3.select("#trail")
      .style("visibility", "");
}

// THIS ISN"T WORKING! //
function drawLegend(colors){
  // Dimensions of legend item: width, height, spacing, radius of rounded rect
  var li = {
    w: 75, h: 30, s: 3, r: 3
  };

  var legend = d3.select("#legend").append("svg:svg")
                  .attr("width", li.w)
                  .attr("height", d3.keys(colors).length * (li.h + li.s));

  var g = legend.selectAll("g")
                .data(d3.entries(colors))
                .enter()
                .append("svg:g")
                .attr("transform", function(d, i){
                  return `translate(0,${i * (li.h + li.s)})`;
                });

  g.append("svg:rect")
    .attr("rx", li.r)
    .attr("ry", li.r)
    .attr("width", li.w)
    .attr("height", li.h)
    .style("fill", d => d.value);

  g.append("svg:text")
    .attr("x", li.w / 2)
    .attr("y", li.h / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .text(d => d.key);
}

function toggleLegend(){
  var legend = d3.select("#legend");
  if (legend.style("visibility") == "hidden"){
    legend.style("visibility", "");
  } else {
    legend.style("visibility", "hidden");
  }
}

// Map the colors into the json - will make easier to pass one variable

function mapColors(data, colors){
  //console.log(colors);
  for (var x = 0; x < data.children.length; x++){
    var nodeA = data.children[x];
    nodeA.color = colors[nodeA.name];
    //console.log(nodeA);
    for (var y = 0; y < nodeA.children.length; y++){
      var nodeB = nodeA.children[y];
      nodeB.color = colors[nodeB.name];
      //console.log(nodeB);
      for (var z = 0; z < nodeB.children.length; z++){
        var nodeC = nodeB.children[z];
        nodeC.color = colors[nodeC.name];
        //console.log(nodeC);
      }
    }
  }
  return data;
}

// Build a partition hierarchy from a CSV
function buildHierarchy(csv){
  var segmentNames = [];
  var root = {"name": "root", "children": []};
  for (var i = 0; i < csv.length; i++){
    var sequence = csv[i][0];
    var users = +csv[i][1];
    if (isNaN(users)) { // e.g. if this is a header row
      continue;
    }
    var parts = sequence.split("-");
    for (q = 0; q < parts.length; q++){
      if (!(segmentNames.includes(parts[q]))){
        segmentNames.push(parts[q]);
      }
    }
    var currentNode = root;
    for (var j = 0; j < parts.length; j++){
      var children = currentNode["children"];
      var nodeName = parts[j];
      var childNode;
      if (j+1 < parts.length){
        var foundChild = false;
        for (var k=0; k < children.length; k++){
          if (children[k]["name"] == nodeName){
            childNode = children[k];
            foundChild = true;
            break;
          }
        }
        // If we don't already have a child, create it
        if (!foundChild) {
          childNode = {"name": nodeName, "children": []};
          children.push(childNode);
        }
        currentNode = childNode;
      } else {
        // Reached the end of the sequence, create a leaf mode
        childNode = {"name": nodeName, "users": users};
        children.push(childNode);
      }
    }
  }
  return {
    root,
    segmentNames
  }
};


// Padding**
// Zoom in view and non Zoom in View.

// Also work on the labels being in the right place
// Changing the data with transitions

// Make manipulable based on
    // - zoom
    // - x-axis
    // - y-axis
    // marker size

// Color in the quadrants of the chart
// Positioning of the labels to avoid circles!

// Manually manipulate
// - zoom
// - x and y cross points
// - marker size
// -- cost and number of users
// -- sunburst linked to bubble chart with multiple options for what is visualized
