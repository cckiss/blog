includeCSS('https://cdn.jsdelivr.net/gh/cckiss/blog/css/l1.download1.css');
$('#container .post-body.entry-content').prepend(`<section id="content"></section>`);

class Download {
	constructor(option) {
		const _ = this;
		if (!option) return;
		_.option = option;
		_.global = (_.option.global) ? _.option.global : window;
	}

	init(obj) {
		const _ = this;

		if (isDefined(_.option.wrap) && _.option.wrap.length) _.setInstance();
		return _;
	}

	setInstance() {
		const _ = this;

	}

}


(function ($, global) {
	"use strict";
	
	let event = null

	namespace('nc.lineage');

	nc.lineage.download = function (download_data) {
		if (isNotDefined(download_data)) throw new Error('nc.lineage.download require data object');

		event = new Download({
			wrap : $('#content'),
			data : download_data
		}).init();
	};

	
}(jQuery, window));