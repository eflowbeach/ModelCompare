/* ************************************************************************

   Authors:   Jonathan Wolfe - based off of Mike Bostocks' horizon charts

************************************************************************ */

/**
 * This is the main application class of your custom application "mc"
 *
 * @asset(mc/*)
 */
qx.Class.define("mc.Application",
{
  extend : qx.application.Inline,

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members :
  {
    /**
     * This method contains the initial application code and gets called
     * during startup of the application
     *
     * @lint ignoreDeprecated(alert)
     */
    main : function()
    {
      // Call super class
      this.base(arguments);

      // Enable logging in debug variant
      if (qx.core.Environment.get("qx.debug"))
      {
        // support native logging capabilities, e.g. Firebug for Firefox
        qx.log.appender.Native;

        // support additional cross-browser console. Press F7 to toggle visibility
        qx.log.appender.Console;
      }

      // Hint: the second and the third parameter control if the dimensions of the element should be respected or not.
      var htmlElement = document.getElementById("isle");
      var inlineIsle = new qx.ui.root.Inline(htmlElement, true, true);

      // use VBox layout instead of basic
      inlineIsle.setLayout(new qx.ui.layout.VBox);

      // Start application
      var me = this;
      var sites = new qx.data.Array();
      me.fields = new qx.data.Array();
      me.models = new qx.data.Array();
      me.ready = new qx.data.Array();

      // Get the config file...
      var req = new qx.io.request.Xhr("resource/mc/getConfig.php?wfo=" + wfo.toLowerCase());
      req.setParser("json");
      req.setCache(true);
      req.setAsync(false);
      req.addListener("success", function(e)
      {
        var response = e.getTarget().getResponse();
        me.weblocation = response.weblocation;
      }, this);

      // A check to see if a wfo was provided
      if (wfo == "") {
        d3.select("#demo").html("<font style='color:red; font-weight:900;'>You need to provide a 3-letter wfo id like this:</font><br><a href=\"http://dev.nids.noaa.gov/~jwolfe/ModelCompare/?wfo=rlx\">http://dev.nids.noaa.gov/~jwolfe/ModelCompare/?wfo=rlx</a>");
      } else {
        req.send();
      }

      // Get Config File - random # to avoid caching
      me.configReq = new qx.io.request.Xhr();

      // Set URL (mandatory)
      me.configReq.setUrl("resource/mc/getConfigDetails.php");

      // Set method
      me.configReq.setMethod("POST");

      //req.setParser("json");

      // Set request data. Accepts String, Map or qooxdoo Object.
      me.configReq.setRequestData( {
        "details" : me.weblocation + "config.csv"
      });
      me.configReq.setCache(false);
      me.configReq.addListener("success", function(e)
      {
        var text = e.getTarget().getResponse();
        var sortedSites = d3.csv.parseRows(text)[0];
        sortedSites.pop();
        sites.append(sortedSites.sort());
        var sortedFields = d3.csv.parseRows(text)[1];
        sortedFields.pop();
        me.fields.append(sortedFields.sort());
        var sortedModels = d3.csv.parseRows(text)[2];
        sortedModels.pop();
        me.models.append(sortedModels.sort());
        me.runAt = new Date(d3.csv.parseRows(text)[3] * 1000);
        me.runAtClone = new Date(d3.csv.parseRows(text)[3] * 1000);

        // Data location
        me.dataLocation = d3.csv.parseRows(text)[4];
        me.ready.append([true]);
        me.plotNewData();
      });
      me.configReq.send();

      // Add Control Window
      var win = new qx.ui.window.Window("Controls");
      win.setMinWidth(200);
      win.setLayout(new qx.ui.layout.VBox());
      me.getRoot().add(win,
      {
        left : 900,
        top : 100
      });
      win.open();

      // Sites
      var siteContainer = new qx.ui.container.Composite(new qx.ui.layout.HBox(10).set( {
        alignY : "middle"
      }));
      me.site = new mc.JQx.SelectBox();
      var optionsUpperController = new qx.data.controller.List(sites, me.site);
      siteContainer.add(new qx.ui.basic.Label("Site:"));
      siteContainer.add(me.site);
      win.add(siteContainer);
      me.site.addListener("changeSelection", function(e) {
        me.plotNewData();
      }, this);

      // Fields
      var fieldContainer = new qx.ui.container.Composite(new qx.ui.layout.HBox(10).set( {
        alignY : "middle"
      }));
      me.field = new mc.JQx.SelectBox();
      var optionsUpperController = new qx.data.controller.List(me.fields, me.field);
      fieldContainer.add(new qx.ui.basic.Label("Field:"));
      fieldContainer.add(me.field);
      win.add(fieldContainer);
      me.field.addListener("changeSelection", function(e) {
        me.plotNewData();
      }, this);

      // Realtime Monitor

      // Get Config File - this updates the time FIXME need to bind selectboxes to this to prevent duplicates
      me.updateReq = new qx.io.request.Xhr();
      me.updateReq.setUrl("resource/mc/getConfigDetails.php");
      me.updateReq.setMethod("POST");
      me.updateReq.setRequestData( {
        "details" : me.weblocation + "config.csv"
      });
      me.updateReq.setCache(false);
      me.updateReq.addListener("success", function(e)
      {
        var text = e.getTarget().getResponse();
        me.runAtClone = new Date(d3.csv.parseRows(text)[3] * 1000);
        me.plotNewData();
      });
      var timer = new qx.event.Timer(1000 * 60 * 3 );
      timer.addListener("interval", function(e) {
        me.updateReq.send();
      });
      timer.start();
    },

    /**
    Plot the data
    */
    plotNewData : function()
    {
      var me = this;
      me.values = {

      };

      // check to make sure fields initialized
      if (me.ready.length != 1) {
        return;
      }

      // Clear current horizon chart and both scales
      d3.select("#demo").selectAll(".horizon").remove();
      d3.select("#demo").selectAll(".rule").remove();
      d3.select("#demo").selectAll("svg").remove();

      // Define the resolution
      var width = 1200;
      var height = 50;

      /**
      UTC Time Scale
      */

      // Create the SVG 'canvas'
      var svg = d3.select("#demo").append("svg").attr("viewBox", "0 0 " + width + " " + height);

      // Set scale to start at midnight UTC of the runtime
      var midnightToday = me.runAt;
      midnightToday.setUTCHours(0, 0, 0, 0);
      var dataset = [midnightToday, midnightToday.getTime() + 1000 * 3600 * 24 * 10.220];

      // Define the padding around the scale
      var padding = 50;

      // Set the scales
      var minDate = new Date(d3.min(dataset));
      var maxDate = d3.max(dataset);
      var xScale = d3.time.scale.utc().domain([minDate, maxDate]).range([-24, width]);
      var yScale = d3.scale.linear().domain([0, d3.max(dataset, function(d) {
        return d.value;
      })]).range([height, 0]);

      // x-axis
      var format = d3.time.format("%a %d %b");
      var xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(format).ticks(d3.time.days, 1);
      svg.append("g").attr("class", "axis x-axis").attr("transform", "translate(0," + (height - padding) + ")").call(xAxis);

      // Hack for a minor-axis
      var xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat("").ticks(d3.time.days, 1);
      svg.append("g").attr("class", "axis x-axis").attr("transform", "translate(60,0)").call(xAxis);

      // Axis Label
      svg.append("text").attr("text-anchor", "middle")  // this makes it easy to center the text as the transform is applied to the anchor
      .attr("transform", "translate(" + (width / 2) + "," + (height - (padding / 3) + 4) + ")")  // center below axis
      .text("Date (UTC)");

      // Add age of data to graph
      var age = (new Date().getTime() - me.runAtClone.getTime()) / 1000;
      var hhmm = me.splitTime(age);
      if (age < 3600 * 3) {
        var ageColor = "#07a842";
      } else {
        ageColor = "#FF0000";
      }
      svg.append("text").attr("text-anchor", "left")  // this makes it easy to center the text as the transform is applied to the anchor
      .attr("transform", "translate(0," + (height - (padding / 3) + 8) + ")")  // center below axis
      .attr("fill", ageColor).attr("font-weight", "bold").text("Last ran: " + hhmm + " ago");

      /**
      HORIZON Charts...
      */
      var context = cubism.context().step(3600 * 1000).size(240 * 5).stop();
      var horizon = context.horizon();
      var fieldName = me.field.getSelection()[0].getLabel();

      // Easily generate ramps with: http://colorbrewer2.org/
      if (fieldName == "PoP" || fieldName == "QPF") {
        var colors = ["#08519c", "#3182bd", "#6baed6", "#bdd7e7", "#bae4b3", "#74c476", "#31a354", "#006d2c"];
      } else if (fieldName == "SnowAmt") {
        colors = ['rgb(239,243,255)', 'rgb(189,215,231)', 'rgb(107,174,214)', 'rgb(33,113,181)', '#c6dbef', '#6baed6', '#2171b5', '#08306b'];
      } else if (fieldName == "Wind" || fieldName == "WindGust") {
        colors = ['rgb(242,240,247)', 'rgb(203,201,226)', 'rgb(158,154,200)', 'rgb(106,81,163)', 'rgb(242,240,247)', 'rgb(203,201,226)', 'rgb(158,154,200)', 'rgb(106,81,163)'];
      } else if (fieldName == "T") {
        // Nice ramp, just reverse it for hot and cold
        colors = ["rgb(33,102,172)", "rgb(67,147,195)", "rgb(146,197,222)", "rgb(209,229,240)", "rgb(253,219,199)", "rgb(244,165,130)", "rgb(214,96,77)", "rgb(178,24,43)"];
      } else {
        colors = ["#08519c", "#3182bd", "#6baed6", "#bdd7e7", "#bae4b3", "#74c476", "#31a354", "#006d2c"];
      }



      // Add the vertical sampling line
      d3.select("#demo").append("div").attr("class", "rule").call(context.rule());
      d3.select("#demo").selectAll(".horizon").data(me.models.toArray().map(stock)).enter().insert("div", ".bottom").attr("class", "horizon").call(context.horizon().colors(colors).format(d3.format("+,.2r")));
      context.on("focus", function(i)
      {
        var format = d3.time.format.utc("%HZ %a %b %d");
        var fieldName = me.field.getSelection()[0].getLabel();
        if (fieldName == "PoP" || fieldName == "RH") {
          var units = " %";
        } else if (fieldName == "SnowAmt" || fieldName == "QPF") {
          units = " \"";
        } else if (fieldName == "Wind" || fieldName == "WindGust") {
          units = " KT";
        } else if (fieldName == "T") {
          units = "\xBAF";
        } else {
          units = "";
        }



        var model = 0;

        // Spit out the values
        d3.selectAll(".value")[0].forEach(function(d)
        {
          // Fix mouseover time
          var midnightToday = me.runAt;
          midnightToday.setUTCHours(0, 0, 0, 0);
          if (fieldName == "T")
          {
            try {
              var tval = me.values[me.models.toArray()[model]][i];
            }catch (e) {
              tval = '';
            }
            d.innerHTML = d.innerHTML + units + ' (' + (isNaN(tval) ? '' : tval) + units + ') - ' + format(new Date(midnightToday.getTime() + (i * 3600 * 1000 / 5)));
          } else
          {
            d.innerHTML = d.innerHTML.substr(1) + units + ' - ' + format(new Date(midnightToday.getTime() + (i * 3600 * 1000 / 5)));
          }
          model++;
        })
        if (fieldName == "T") {
          d3.selectAll(".value").style("right", i == null ? null : context.size() - i - 250 + "px");
        } else {
          d3.selectAll(".value").style("right", i == null ? null : context.size() - i - 200 + "px");
        }
      });

      /**
      Go get the data and then scale plot, then scale data to the horizon plot size 1px per data point
      */
      function stock(name) {
        return context.metric(function(start, stop, step, callback)
        {
          // Add random # to avoid caching

          //          d3.csv(me.dataLocation + me.field.getSelection()[0].getLabel() + "_" + name + "_" + me.site.getSelection()[0].getLabel() + ".csv" + '?' + Math.floor(Math.random() * 1000), function(rows)

          //          {
          var req = new qx.io.request.Xhr();

          // Set URL (mandatory)
          req.setUrl("resource/mc/getData.php");

          // Set method
          req.setMethod("POST");

          //req.setParser("json");

          // Set request data. Accepts String, Map or qooxdoo Object.
          req.setRequestData( {
            "data" : me.dataLocation + me.field.getSelection()[0].getLabel() + "_" + name + "_" + me.site.getSelection()[0].getLabel() + ".csv" + '?' + Math.floor(Math.random() * 1000)
          });
          req.addListener("success", function(e)
          {
            var rows = d3.csv.parse(e.getTarget().getResponse());
            var fieldName = me.field.getSelection()[0].getLabel();
            rows = rows.map(function(d) {
              return [new Date(d.Date * 1000), d.Value, parseInt(d.Value2)];
            });
            if (fieldName == "PoP") {
              var maxVal = 100;
            } else if (fieldName == "SnowAmt") {
              maxVal = 6;
            } else if (fieldName == "Wind" || fieldName == "WindGust") {
              maxVal = 30;
            } else if (fieldName == "QPF") {
              maxVal = 1;
            } else {
              maxVal = 25;
            }



            var date = new Date(), values = [0, maxVal];  // <-- make a default range

            /**
            Replicate data until it fills window width since we have less data values than pixels
            this was originally meant for real time plotting of high resolution temporal data like CPU processing.

            1200 px / 240 hours = 5 px/hr  (so make 5 copies of a value)
            */
            tvalues = [];
            rows.forEach(function(d)
            {
              values.push(d[1], d[1], d[1], d[1], d[1]);
              if (fieldName == "T") {
                tvalues.push(d[2], d[2], d[2], d[2], d[2])
              }
            });
            me.values[name] = tvalues;
            callback(null, values);
          }, this);
          req.send();
        }, name);
      }

      /**
      Local Time Scale
      */

      // Create the SVG 'canvas'
      var svg = d3.select("#demo").append("svg").attr("viewBox", "0 0 " + width + " " + height)

      // get the data
      var dataset = [midnightToday, midnightToday.getTime() + 1000 * 3600 * 24 * 10.05];  //9.90];

      // Define the padding around the graph
      var padding = 50;

      // Set the scales
      var minDate = midnightToday;
      var maxDate = d3.max(dataset);
      var xScale = d3.time.scale().domain([minDate, maxDate]).range([-4, width]);
      var yScale = d3.scale.linear().domain([0, d3.max(dataset, function(d) {
        return d.value;
      })]).range([height, 0]);

      // x-axis
      var format = d3.time.format("%a %d %b");
      var xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(format).ticks(d3.time.days, 1);
      svg.append("g").attr("class", "axis x-axis").attr("transform", "translate(0," + (height - padding) + ")").call(xAxis);

      // Hack for a minor-axis
      var xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat("").ticks(d3.time.days, 1);
      svg.append("g").attr("class", "axis x-axis").attr("transform", "translate(60,0)").call(xAxis);

      // Axis Label
      svg.append("text").attr("text-anchor", "middle")  // this makes it easy to center the text as the transform is applied to the anchor
      .attr("transform", "translate(" + (width / 2) + "," + (height - (padding / 3) + 4) + ")")  // center below axis
      .text("Date (Local)");
    },

    /**
    Split seconds into hhmm
    */
    splitTime : function(a)
    {
      var hours = Math.floor(a / 3600);
      var minutes = Math.floor(a / 60) - (hours * 60);

      //var seconds=a-(hours*3600)-(minutes*60);
      var hs = ' hour';
      var ms = ' minute';  //var ss=' second';
      if (hours != 1) {
        hs += 's'
      }
      if (minutes != 1) {
        ms += 's'
      }
      return hours + hs + ', ' + minutes + ms;
    }
  }
});
