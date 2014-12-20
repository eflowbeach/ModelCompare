/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

/* ************************************************************************


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

      /*
      -------------------------------------------------------------------------
        Below is your actual application code...
      -------------------------------------------------------------------------
      */

      /*
      -------------------------------------------------------------------------
        USE AN EXISTING NODE TO ADD WIDGETS INTO THE PAGE LAYOUT FLOW
      -------------------------------------------------------------------------
      */

      // Hint: the second and the third parameter control if the dimensions

      // of the element should be respected or not.
      var htmlElement = document.getElementById("isle");
      var inlineIsle = new qx.ui.root.Inline(htmlElement, true, true);

      // use VBox layout instead of basic
      inlineIsle.setLayout(new qx.ui.layout.VBox);

      /*
      -------------------------------------------------------------------------
        ADD WIDGETS WITH ABSOLUTE POSITIONING
      -------------------------------------------------------------------------
      */
      var me = this;
      var sites = new qx.data.Array();
      me.fields = new qx.data.Array();
      me.models = new qx.data.Array();
      me.ready = new qx.data.Array();
      d3.text("http://dev.nids.noaa.gov/~jwolfe/ModelCompare/data/models.csv", function(text)
      {
        // text = text.substring(0, text.length - 1);
        var sortedModels = d3.csv.parseRows(text)[0].sort();
        me.models.append(sortedModels);
        me.ready.append([true]);
      })
      d3.text("http://dev.nids.noaa.gov/~jwolfe/ModelCompare/data/sites.csv", function(text)
      {
        //text = text.substring(0, text.length - 1);
        var sortedSites = d3.csv.parseRows(text)[0].sort();
        sites.append(sortedSites);
        me.ready.append([true]);
      })
      d3.text("http://dev.nids.noaa.gov/~jwolfe/ModelCompare/data/fields.csv", function(text)
      {
        //text = text.substring(0, text.length - 1);
        var sortedFields = d3.csv.parseRows(text)[0].sort();
        me.fields.append(sortedFields);
        me.ready.append([true]);
      })
      var win = new qx.ui.window.Window("Controls");
      win.setMinWidth(200);
      win.setLayout(new qx.ui.layout.VBox());
      me.getRoot().add(win,
      {
        left : 900,
        top : 100
      });
      win.open();
      me.site = new mc.JQx.SelectBox();
      var optionsUpperController = new qx.data.controller.List(sites, me.site);
      win.add(me.site);
      me.site.addListener("changeSelection", function(e) {
        me.test();
      }, this);
      me.field = new mc.JQx.SelectBox();
      var optionsUpperController = new qx.data.controller.List(me.fields, me.field);
      win.add(me.field);
      me.field.addListener("changeSelection", function(e) {
        me.test();
      }, this);

      //              me.field.setSelection([me.field.getSelectables()[0]]);
      setTimeout(function() {
        me.test();
      }, 300);
    },
    test : function()
    {
      var me = this;

      // check to make sure all initialization files have been loaded
      if (me.ready.length != 3) {
        return;
      }

      // Clear
      d3.select("body").selectAll(".horizon").remove();
      d3.select("body").selectAll(".rule").remove();
      d3.select("body").selectAll("svg").remove();

      // Define the resolution
      var width = 1202;
      var height = 50;

      // Create the SVG 'canvas'
      var svg = d3.select("body").append("svg").attr("viewBox", "0 0 " + width + " " + height)
      var midnightToday = new Date();
      midnightToday.setUTCHours(0, 0, 0, 0);

      // get the data
      var dataset = [midnightToday, new Date().getTime() + 1000 * 3600 * 24 * 11];

      // Define the padding around the graph
      var padding = 50;

      // Set the scales
      var minDate = new Date(d3.min(dataset));
      var maxDate = d3.max(dataset);
      var xScale = d3.time.scale.utc().domain([minDate, maxDate]).range([-20, width]);
      var yScale = d3.scale.linear().domain([0, d3.max(dataset, function(d) {
        return d.value;
      })]).range([height, 0]);

      // x-axis
      var format = d3.time.format("%a %d %b");
      var xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(format).ticks(d3.time.days, 1);
      svg.append("g").attr("class", "axis x-axis").attr("transform", "translate(0," + (height - padding) + ")").call(xAxis);

      // HORIZON Charts...
      var context = cubism.context()  //  .serverDelay( Date.now())

      //.serverDelay(new Date(2012, 4, 2) - Date.now())

      //.step(864e5)

      //.size(1280)
      .step(3600 * 1000).size(240 * 5 + 2).stop();
      var horizon = context.horizon()
      d3.select("body").append("div").attr("class", "rule").call(context.rule());
      d3.select("body").selectAll(".horizon").data(me.models.toArray().map(stock)).enter().insert("div", ".bottom").attr("class", "horizon").call(context.horizon().format(d3.format("+,.2r")));

      //      d3.select("body").selectAll(".horizon").call(horizon.colors(['rgb(241,238,246)','rgb(189,201,225)','rgb(116,169,207)','rgb(5,112,176)','rgb(241,238,246)','rgb(189,201,225)','rgb(116,169,207)','rgb(5,112,176)'])).call(horizon.scale([0,100]));
      context.on("focus", function(i)
      {
        var format = d3.time.format.utc("%HZ %a %b %d");
        if (me.field.getSelection()[0].getLabel() == "PoP") {
          var units = "%";
        } else if (me.field.getSelection()[0].getLabel() == "SnowAmt") {
          units = "\"";
        }

        d3.selectAll(".value")[0].forEach(function(d)
        {
          d.innerHTML = d.innerHTML.substr(1) + units + ' - ' + format(new Date(new Date().getTime() + (i * 3600 * 1000 / 5)));  // - diff));
        })
        d3.selectAll(".value").style("right", i == null ? null : context.size() - i - 100 + "px");
      });
      function stock(name) {
        return context.metric(function(start, stop, step, callback) {
          d3.csv("http://dev.nids.noaa.gov/~jwolfe/ModelCompare/data/" + me.field.getSelection()[0].getLabel() + "_" + name + "_" + me.site.getSelection()[0].getLabel() + ".csv", function(rows)
          {
            rows = rows.map(function(d) {
              return [new Date(d.Date * 1000), d.Value];
            });
            if (me.field.getSelection()[0].getLabel() == "PoP") {
              var maxVal = 100;
            } else if (me.field.getSelection()[0].getLabel() == "SnowAmt") {
              maxVal = 3;
            }

            var date = new Date(), values = [0, maxVal];  // <-- make a default range
            rows.forEach(function(d) {
              values.push(d[1], d[1], d[1], d[1], d[1]);
            });
            callback(null, values);
          });
        }, name);
      }
    }
  }
});
