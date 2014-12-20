



var plot = function(site){



        // Define the resolution
        var width = 1202;
        var height = 50;

        // Create the SVG 'canvas'
        var svg = d3.select("body")
            .append("svg")
            .attr("viewBox", "0 0 " + width + " " + height)

var midnightToday = new Date();
midnightToday.setUTCHours(0,0,0,0);
        // get the data
        var dataset = [
           midnightToday, new Date().getTime() + 1000 * 3600 * 24 * 11
        ];

        // Define the padding around the graph
        var padding = 50;

        // Set the scales
        var minDate = new Date(d3.min(dataset));
        var maxDate = d3.max(dataset);
        var xScale = d3.time.scale.utc()
            .domain([minDate, maxDate])
            .range([-20, width]);
        var yScale = d3.scale.linear()
            .domain([0, d3.max(dataset, function(d) { return d.value; })])
            .range([height, 0]);
        // x-axis
        var format = d3.time.format("%a %d %b");
        var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom")
            .tickFormat(format)
            .ticks(d3.time.days, 1);

        svg.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", "translate(0," + (height - padding) + ")")
            .call(xAxis);







// HORIZON Charts...

var context = cubism.context()
  //  .serverDelay( Date.now())
    //.serverDelay(new Date(2012, 4, 2) - Date.now())
    //.step(864e5)
    //.size(1280)
    .step(3600 * 1000 )
    .size(240*5+2)
    .stop();

d3.select("body").append("div")
    .attr("class", "rule")
    .call(context.rule());

d3.select("body").selectAll(".horizon")
    .data(["Fcst", "CONSAll", "GFS40", "ECMWFHiRes",  "AllBlend","CMCnh","CONSMOS", "CONSRaw","HPCGuide","HRRR","MOSGuide",
                  "NAM12","NamDNG5","CMCreg","ADJMAV", "ADJMET","RUC13","SREF","wrfar5","wrfarw","wrfnmm"].map(stock))
    .enter().insert("div", ".bottom")
    .attr("class", "horizon")
    .call(context.horizon()
    .format(d3.format("+,.2r")));

context.on("focus", function(i) {
       var format = d3.time.format.utc("%HZ %a %b %d");
       d3.selectAll(".value")[0].forEach(function(d) {
           d.innerHTML =  d.innerHTML.substr(1) +'% - '+ format(new Date(new Date().getTime() + (i * 3600 * 1000/5)));     // - diff));
       })
         d3.selectAll(".value").style("right", i == null ? null : context.size() - i  -100+ "px");
       });


function stock(name) {
     return context.metric(function(start, stop, step, callback) {
    d3.csv("data/PoP_" + name + "_"+site+".csv", function(rows) {
      rows = rows.map(function(d) {
            return [new Date(d.Date * 1000), d.Value]; });
      var date = new Date(), values = [0,100]; // <-- make a default range
      rows.forEach(function(d) {
        values.push(d[1],d[1],d[1],d[1],d[1]);
      });
      callback(null, values);
    });
  }, name);
}
}

plot("KCRW");

setTimeout(function(e){
// Clean
            d3.select("body").selectAll("*").remove();
               plot("KCRW");
},2000);