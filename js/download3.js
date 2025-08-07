includeCSS('https://cdn.jsdelivr.net/gh/cckiss/blog/css/l1.download1.css');
$('#container .post-body.entry-content').prepend(`<div class="wrap-section-launcher"><section class="download"></div></div>`);

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
		
		let tmpl = ``;
		for (var i=0; i<_.option.data.count; i++) {
			tmpl += `<div class="download_area">` +
				`<div class="download_area_inner">` +
					`<div class="icon_launcher2"></div>` +
					`<div class="text_wrap">` +
						`<h2>클라이언트</h2>` +
						`<p class="desc">게임을 시작하려면 클라이언트를 설치해야 합니다.</p>` +
					`</div>` +
					`<a href="${_.option.data.url}" id="downloadUrl" class="btn_download" title="클라이언트"><span class="icon_download"></span>클라이언트 다운로드</a>` +
				`</div>` +
			`</div>`;
		}

		_.option.wrap.empty().append(tmpl);
	}

}


(function ($, global) {
	"use strict";
	
	let download = null

	namespace('nc.lineage');

	nc.lineage.download = function (download_data) {
		if (isNotDefined(download_data)) throw new Error('nc.lineage.download require data object');

		download = new Download({
			wrap : $('.wrap-section-launcher .download'),
			data : download_data
		}).init();
	};

	
}(jQuery, window));