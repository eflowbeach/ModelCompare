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
      d3.text("http://dev.nids.noaa.gov/~jwolfe/ModelCompare/data/config.csv", function(text)
      {
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
        me.ready.append([true]);
        me.plotNewData();
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
    },

    /**
    Plot the data
    */
    plotNewData : function()
    {
      var me = this;

      // check to make sure fields initialized
      if (me.ready.length != 1) {
        return;
      }

      // Clear
      d3.select("body").selectAll(".horizon").remove();
      d3.select("body").selectAll(".rule").remove();
      d3.select("body").selectAll("svg").remove();

      // Define the resolution
      var width = 1200;
      var height = 50;

      /**
      UTC Time Scale
      */

      // Create the SVG 'canvas'
      var svg = d3.select("body").append("svg").attr("viewBox", "0 0 " + width + " " + height)
      var midnightToday = me.runAt;  //new Date();
      midnightToday.setUTCHours(0, 0, 0, 0);

      // get the data
      var dataset = [midnightToday, midnightToday.getTime() + 1000 * 3600 * 24 * 10.220];

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
      svg.append("text").attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
      .attr("transform", "translate(" + (width / 2) + "," + (height - (padding / 3) + 4) + ")")  // centre below axis
      .text("Date (UTC)");

      /**
      HORIZON Charts...
      */
      var context = cubism.context().step(3600 * 1000).size(240 * 5).stop();
      var horizon = context.horizon();
      var fieldName = me.field.getSelection()[0].getLabel();
      if (fieldName == "PoP" || fieldName == "QPF") {
        var colors = ["#08519c", "#3182bd", "#6baed6", "#bdd7e7", "#bae4b3", "#74c476", "#31a354", "#006d2c"];
      } else if (fieldName == "SnowAmt") {
        colors = ['rgb(239,243,255)', 'rgb(189,215,231)', 'rgb(107,174,214)', 'rgb(33,113,181)', '#c6dbef', '#6baed6', '#2171b5', '#08306b'];
      } else if (fieldName == "WindGust") {
        colors = ['rgb(242,240,247)', 'rgb(203,201,226)', 'rgb(158,154,200)', 'rgb(106,81,163)', 'rgb(242,240,247)', 'rgb(203,201,226)', 'rgb(158,154,200)', 'rgb(106,81,163)'];
      } else if (fieldName == "T")
      {
        colors = ['rgb(178,24,43)', 'rgb(214,96,77)', 'rgb(244,165,130)', 'rgb(253,219,199)', 'rgb(209,229,240)', 'rgb(146,197,222)', 'rgb(67,147,195)', 'rgb(33,102,172)'];
        colors = colors.reverse();
      }



      d3.select("body").append("div").attr("class", "rule").call(context.rule());
      d3.select("body").selectAll(".horizon").data(me.models.toArray().map(stock)).enter().insert("div", ".bottom").attr("class", "horizon").call(context.horizon().colors(colors).format(d3.format("+,.2r")));
      context.on("focus", function(i)
      {
        var format = d3.time.format.utc("%HZ %a %b %d");
        var fieldName = me.field.getSelection()[0].getLabel();
        if (fieldName == "PoP") {
          var units = "%";
        } else if (fieldName == "SnowAmt" || fieldName == "QPF") {
          units = "\"";
        } else if (fieldName == "WindGust") {
          units = "KT";
        } else if (fieldName == "T") {
          units = "\xBAF";
        }



        d3.selectAll(".value")[0].forEach(function(d)
        {
          // Fix mouseover time
          var midnightToday = me.runAt;  //new Date();
          midnightToday.setUTCHours(0, 0, 0, 0);
          if (fieldName == "T")
          {
            d.innerHTML = d.innerHTML + units + ' - ' + format(new Date(midnightToday.getTime() + (i * 3600 * 1000 / 5)));  // - diff));
          } else
          {
            d.innerHTML = d.innerHTML.substr(1) + units + ' - ' + format(new Date(midnightToday.getTime() + (i * 3600 * 1000 / 5)));  // - diff));
          }
        })
        d3.selectAll(".value").style("right", i == null ? null : context.size() - i - 200 + "px");
      });
      function stock(name) {
        return context.metric(function(start, stop, step, callback) {
          d3.csv("http://dev.nids.noaa.gov/~jwolfe/ModelCompare/data/" + me.field.getSelection()[0].getLabel() + "_" + name + "_" + me.site.getSelection()[0].getLabel() + ".csv", function(rows)
          {
            rows = rows.map(function(d) {
              return [new Date(d.Date * 1000), d.Value];
            });
            var fieldName = me.field.getSelection()[0].getLabel();
            if (fieldName == "PoP") {
              var maxVal = 100;
            } else if (fieldName == "SnowAmt") {
              maxVal = 3;
            } else if (fieldName == "WindGust") {
              maxVal = 40;
            } else if (fieldName == "QPF") {
              maxVal = 1;
            } else {
              maxVal = 10;
            }



            var date = new Date(), values = [0, maxVal];  // <-- make a default range
            rows.forEach(function(d) {
              values.push(d[1], d[1], d[1], d[1], d[1]);
            });
            callback(null, values);
          });
        }, name);
      }

      /**
      Local Time Scale
      */

      // Create the SVG 'canvas'
      var svg = d3.select("body").append("svg").attr("viewBox", "0 0 " + width + " " + height)

      //var midnightToday = new Date();

      //midnightToday.setHours(0, 0, 0, 0);

      // get the data
      var dataset = [midnightToday, midnightToday.getTime() + 1000 * 3600 * 24 * 9.90];

      // Define the padding around the graph
      var padding = 50;

      // Set the scales
      var minDate = midnightToday;  //new Date(d3.min(dataset));
      var maxDate = d3.max(dataset);
      console.log(minDate, maxDate);
      var xScale = d3.time.scale().domain([minDate, maxDate]).range([0, width]);
      var yScale = d3.scale.linear().domain([0, d3.max(dataset, function(d) {
        return d.value;
      })]).range([height, 0]);

      // x-axis
      var format = d3.time.format("%a %d %b");
      var xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(format).ticks(d3.time.days, 1);
      svg.append("g").attr("class", "axis x-axis").attr("transform", "translate(0," + (height - padding) + ")").call(xAxis);
      svg.append("text").attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
      .attr("transform", "translate(" + (width / 2) + "," + (height - (padding / 3) + 4) + ")")  // centre below axis
      .text("Date (Local)");
    }
  }
});
