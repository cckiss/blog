includeCSS('https://cdn.jsdelivr.net/gh/cckiss/blog/css/l1.download2.css');
$('#container .post-body.entry-content').prepend(`<div class="wrap-section-launcher"></div>`);

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
		
		let tmpl = _.option.data.map( (item, index) => { 
			return `<section class="download">` +
				`<div class="download_area">` +
					`<div class="download_area_inner">` +
						`<div class="icon_launcher2"></div>` +
						`<div class="text_wrap">` +
							`<h2>${item.title}</h2>` +
							`<p class="desc">게임을 시작하려면 ${item.title}를 설치해야 합니다.</p>` +
							`<span class="comment">* 구글 로그인 후 다운로드를 진행해 주시기 바랍니다.</span>` +
						`</div>` +
						`<a href="${item.url}" id="downloadUrl" class="btn_download" title="클라이언트"><span class="icon_download"></span>${item.title} 다운로드</a>` +
					`</div>` +
				`</div>` +
			`</section>`;
		}).join('');

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
			wrap : $('.wrap-section-launcher'),
			data : download_data
		}).init();
	};

	
}(jQuery, window));