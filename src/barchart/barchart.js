(function ($, d3) {
	if (!$ || !d3) throw "Need jQuery and D3";

	//
	$.extend({
		_setAxis_: {
			_update: function (that) {
				var svs =that.svgValues;
				
				var t = function (_) {
					if (!svs[_ + "Axis"]) return;
					that.container.select('.axis-' + _).call(svs[_ + "Axis"]);
				};

				t("x"), t("y");
			},
			_calPadding: function (that) {
				var svs = that.svgValues;
				svs._xNamePos = 10,
				svs._yNamePos = 10;
				if (svs.xAxis) {
					var mx = 0, h = 0;
					var axis_x = that.container.select('.axis-x');
					axis_x.selectAll('.tick').each(function() {
					});
				}
			},
			redraw: function (that) {
				var svs = that.svgValues;
				var os = that.options;
				var size = $._getSize_(that);

				var t = function (_, __, ___) {
					if (!svs[_ + "Axis"]) return;
					that.container.select('.axis-' + _)
						.attr("transform", "translate(" + __ + ")")
						.select('.axis-name')
						.attr("transform", "translate(" + ___ + ")");
				};

				this._update(that);
				this._calPadding(that);

				t("x",
					[(os.axis_y == "left" ? os.yMaxWidth : 0), (os.axis_x == "bottom" ? size[1] - os.xMaxHeight : os.xMaxHeight)],
					[(size[0] - os.yMaxWidth) / 2, svs._xNamePos]),
				t("y",
					[(that.options.axis_y == "left" ? os.yMaxWidth : size[0] - os.yMaxWidth), (os.axis_x == "bottom" ? 0 : os.xMaxHeight)],
					[svs._yNamePos, (size[1] - os.xMaxHeight) / 2]);
			},
			setGrid: function (that) {
				var svs = that.svgValues;
				var size = $._getSize_(that);
				if (svs.xAxis)
					svs.xAxis
						.innerTickSize(that.options.grid_x ? -size[1] : 6)
						.tickPadding(that.options.grid_x ? 9 : 3);
				if (svs.yAxis)
					svs.yAxis
						.innerTickSize(that.options.grid_y ? -size[0] : 6)
						.tickPadding(that.options.grid_y ? 9 : 3);

				this._update(that);
			},
			setName: function (that, names) {
				var svs =that.svgValues;
				
				var t = function (_) {
					if (!svs[_ + "Axis"]) return;
					that.container.select('.axis-' + _ + ' .axis-name').text(names[_]);
				};
				
				t("x"), t("y");
			},
		},
		_BarChart: {
			version: null,
			element: null,
			options: null,
			_create: function () {
				this.element.addClass('bar-chart');
				this.svg = d3.select(this.element[0]).append("svg");
				this.svg.attr('class', 'chart-svg');
				this.container = this.svg.append("g").attr({
					'class': 'svg-container',
					transform: "translate(" + [this.options.margin, this.options.margin] + ")"
				});

				this._init();
				this._update();
			},
			_init: function () {
				if (this.svgValues) return;
				var svs = this.svgValues = {};

				svs.colorScale = d3.scale.category20(),
				svs.x = d3.scale.ordinal(),
				svs.y = d3.scale.linear(),
				svs.xAxis = d3.svg.axis(),
				svs.yAxis = d3.svg.axis();

				svs.x.domain([]).rangeRoundBands([0, 1], .1),
				svs.y.domain([0, 1]).range([1, 0]),
				svs.xAxis.scale(svs.x).orient(this.options.axis_x),
				svs.yAxis.scale(svs.y).orient(this.options.axis_y);

				this.container.append("g").attr('class', 'axis axis-x')
					.append("text")
					.attr('class', 'axis-name'),
				this.container.append("g").attr('class', 'axis axis-y')
					.append("text")
					.attr('class', 'axis-name'),
				this.entities = this.container.append("g").attr('class', 'entities');

				//init axis
				this._setAxis();
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

				that.entities.selectAll('.bar')
					.attr({
						id: function (d) { return 'bar_' + d._tid; },
						fill: function (d) { return svs.colorScale(d.name); },
					});

				that._redraw();
			},
			_redraw: function () {
				var that = this;
				var os = that.options;
				var size = $._getSize_(that);
				var svs = that.svgValues;
				var margin = that.options.margin;

				svs.x.rangeRoundBands([0, size[0] - os.yMaxWidth], .1);
				svs.y.range([size[1] - os.xMaxHeight, 0]);
				if (os.axis_x == "top") svs.y.range(svs.y.range().reverse());

				that.svg.attr({
					width: size[0] + that.options.margin*2,
					height: size[1] + that.options.margin*2,
				});

				var bars = that.entities.attr("transform", "translate(" + [(os.axis_y == "left" ? os.yMaxWidth : 0), (os.axis_x == "bottom" ? 0 : os.xMaxHeight)] + ")")
					.selectAll('.bar');
				os.animate > 0 ? bars = bars.transition().duration(os.animate) : null;
				bars.attr({
						y: function (d) {
							return os.axis_x == "bottom" ? svs.y(d.value) : 0;
						},
						height: function (d) {
							return $._resetMin_((os.axis_x == "bottom" ?
								size[1] - os.xMaxHeight - svs.y(d.value)
								: svs.y(d.value)), 1);
						},
						width: function (d) { return $._resetMin_(svs.x.rangeBand(), 1)},
						x: function (d) { return svs.x(d.name); }
					});

				that._setAxis("redraw");
			},
			_setAxis: function (option) {
				//setName,setGrid,redraw
				var that = this;
				var svs = that.svgValues;
				if (option == "setName") {
					$._setAxis_.setName(that,
						{x: "X", y: "Y"});
					return;
				}
				if (option == "setGrid") {
					$._setAxis_.setGrid(that);
					return;
				}
				if (option == "redraw") {
					$._setAxis_.redraw(that);
					return;
				}
				if (option == "setOrient") {
					svs.xAxis.orient(that.options.axis_x),
					svs.yAxis.orient(that.options.axis_y);
					return;
				}
				//init
				//init name
				$._setAxis_.setName(that,
					{x: "X", y: "Y"});
				//init grid
				$._setAxis_.setGrid(that);
				//init redraw
				$._setAxis_.redraw(that);
			},
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
					grid_x: false,
					grid_y: false,
					margin: 10,
					axis_x: "bottom",
					axis_y: "left",
					xMaxHeight: 50,
					yMaxWidth: 60,
					clickFun: false,
					brushFun: false,
					animate: 200,
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
					return api;
				}
				if (key == "axis_x" || key == "axis_y") {
					$._BarChart._setAxis("setOrient");
					$._BarChart._redraw();
					return api;
				}
				return api;
			};
			api.redraw = function () {
				api._proxy();
				$._BarChart._redraw();
				return api;
			};
			api.isSelected = function () {
				api._proxy();
				return api;
			};
			return api;
		},
	});

})(jQuery, d3);