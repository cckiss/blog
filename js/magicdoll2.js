const pageCnbType = 2;
const pageCnbSubType = 3;
includeCSS('https://cdn.jsdelivr.net/gh/cckiss/blog/css/magicdoll1.css');

class MagicDoll {
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
			return `<tr><td class="level thead"><img src="${item.thumbnail}"><span>${item.desc}</span></td><td class="">${item.donus}</td></tr>`;
		}).join('');
		_.option.wrap.empty().append(tmpl);
	}
}


(function ($, global) {
	"use strict";
	
	let guide = null

	namespace('nc.lineage');

	nc.lineage.doll = function (doll_data) {
		if (isNotDefined(doll_data)) throw new Error('nc.lineage.doll require data object');

		const tpl = `<div class="wrap-section-beginner">` +
			`<div class="wrap-section-top">` +
				`<section class="section-top">` +
					`<header><p class="copy__subtitle">${doll_data.server_name} 마법인형</p><span class="copy__x"></span><h1 class="copy__title">마법인형 정보</h1></header>` +
				`</section>` +
			`</div>` +
			`<div class="wrap-section-hunt">` +
				`<section class="section-hunt">` +
					`<article>` +
						`<div class="article-hunt">` +
							`<div class="table-bundle">` +
								`<div class="table-bundle-row">` +
									`<table class="table table-size-1" id="quest-1" style="display: table;">` +
										`<thead><tr><th class="name thead"><span>마법인형</span></th><th class="name">정보</th></tr></thead>` +
										`<tbody class="doll_list"></tbody>` +
									`</table>` +
								`</div>` +
							`</div>` +
						`</div>` +
					`</article>` +
				`</section>` +
			`</div>` +
		`</div>`;
		$('#container .post-body.entry-content').prepend(tpl);

		guide = new MagicDoll({
			wrap : $('.wrap-section-hunt .doll_list'),
			data : doll_data.data
		}).init();
	};

	
}(jQuery, window));