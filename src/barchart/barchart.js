(function ($, d3) {
	if (!$ || !d3) throw "Need jQuery and D3";

	//
	$.extend({
		_setAxis_: {
			update: function (that, xName, yName) {},
			setPadding: function () {},
			redraw: function () {},
		},
		_BarChart: {
			version: null,
			element: null,
			options: null,
			_create: function () {
				this.element.addClass('bar-chart');
				this.svg = d3.select(this.element[0]).append("svg");
				this.svg.attr('class', 'chart-svg');
				this.container = this.svg.append("g").attr('class', 'svg-container');

				this._init();
				this._update();
			},
			_init: function () {
				if (this.svgValues) return;
				var svs = this.svgValues = {
					top: 0, bottom: 0, left: 0, right: 0
				};

				svs.colorScale = d3.scale.category20(),
				svs.x = d3.scale.ordinal(),
				svs.y = d3.scale.linear(),
				svs.xAxis = d3.svg.axis(),
				svs.yAxis = d3.svg.axis();

				this.container.append("g").attr('class', 'axis axis-x')
					.append("text")
					.attr('class', 'axis-name'),
				this.container.append("g").attr('class', 'axis axis-y')
					.append("text")
					.attr('class', 'axis-name'),
				this.entities = this.container.append("g").attr('class', 'entities');
			},
			_update: function () {
				var that = this;
				var series = that.options.series;
				var svs = that.svgValues;

				if (!series) series = [];

				var names = series.map(function(d) { return d.name; });

				that._buildId(series);

				svs.colorScale.domain(names),
				svs.x.domain(names),
				svs.y.domain([0, d3.max(series, function (d) { return d.value; })]);

				var rects = that.entities.selectAll('.bar').data(series);
				rects.exit().remove();
				rects.enter().append("rect")
					.classed('bar', true);

				that.entities.selectAll('bar')
					.attr({
						id: function (d) { return 'bar_' + d._tid; },
						fill: function (d) { return svs.colorScale(d.name); },
					});

				that._redraw();
			},
			_redraw: function () {
				var that = this;
				var size = $._getSize_(that);
				var svs = that.svgValues;
				var margin = that.options.margin;

				that.svg.attr({
					width: size[0] + this.options.margin*2,
					height: size[1] + this.options.margin*2,
				});

				that.entities.attr("transform", "translate(" + [svs.left + margin, svs.top + margin] + ")")
					.selectAll('.bar').attr({
						y: function (d) { return svs.y(d.value); },
						height: function (d) { return $._resetMin_(size[1] - svs.y(d.value), 1); },
						width: function (d) { return $._resetMin_(svs.x.rangeBand(), 1)},
					}).transition().duration(100).attr("x", function (d) { return svs.x(d.name); });
			},
			_setAxis: function (option) {},
			_buildId: function (series) {
				var id = (new Date()).getTime();
				for (var i = 0; i < series.length; i++) {
					series[i]._tid = id + "_" + i;
				}
			},
		},
	});
	//
	$.fn.extend({
		BarChart: function (arg1, arg2, arg3) {
			var that = this;
			var api = $(that).data("BarChartAPI");
			if (api && typeof arg1 === "string") {
				if (!api[arg1]) return api;

				if ($.isFunction(api[arg1])) {
					api[arg1](arg2, arg3);
					return api;
				}

				if (arg1 != "option") return api;

				api.setOption(arg2, arg3);
				return api;
			}
			/////////////////////////////////////////
			if (!arg1) arg1 = {};
			api = {
				version: "1.0.0",
				element: that,
				options: {
					showLabel: true,
					showTips: false,
					legendPosition: "none",
					grid_x: true,
					grid_y: false,
					margin: 10,
					axis_x: "bottom",
					axis_y: "left",
					clickFun: false,
					brushFun: false,
					series: null,
				},
				_proxy: function () {
					//init $._BarChart
					$._BarChart.version = api.version,
					$._BarChart.element = api.element,
					$._BarChart.options = api.options;
				},
			};
			//combine all parameters
			$.extend(api.options, arg1);
			//Go
			api._proxy();
			$._BarChart._create();
			//build return API
			api.setOption = function (key, value) {
				api.options[key] = value;
				api._proxy();
				if (key === "series") {
					$._BarChart._update();
					return;
				}
			};
			api.redraw = function () {};
			api.isSelected = function () {};
			return api;
		},
	});

})(jQuery, d3);