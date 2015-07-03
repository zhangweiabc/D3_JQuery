(function ($) {
	if (!$) throw "Need jQuery";

	$.extend({
		_getSize_: function (that) {
			return [$(that.element).width() - that.options.margin*2,
				$(that.element).height() - that.options.margin*2];
		},
		_resetMin_: function (num, min) {
			min ? null : min = 1;
			return num < min ? min : num;
		},
	});

})(jQuery);