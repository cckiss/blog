const pageCnbType = 2;
const pageCnbSubType = 2;
includeCSS('https://cdn.jsdelivr.net/gh/cckiss/blog/css/quest1.css');

class Quest {
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
			return `<table class="table table-size-1" id="quest-${index}" style="display: table;">` +
				`<thead><tr><th class="name thead"><span>레벨</span></th><th class="name">${item.class_name} 퀘스트 정보</th></tr></thead>` +
				`<tbody>${item.levels.map( (info, index) => { return `<tr><td class="level thead"><span>${info.level}</span></td><td>${info.type === 'youtube' ? `<iframe width="560" height="315" src="https://www.youtube.com/embed/${info.info}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` : `${info.info}`}</td></tr>`; }).join('')}</tbody>` +
			`</table>`;
		}).join('');
		_.option.wrap.empty().append(tmpl);
		_.addEvent();
	}

	addEvent() {
		$('.article-tab ul li a').on('click', function(e) {
			if (!$(this).parent('li').hasClass('on')) {
				let level = $(this).attr('data-lv');
				$('.article-tab ul li').removeClass('on');
				$(this).parent('li').addClass('on');
				$('.table').css('display', 'none');
				$('#quest-' + level).css('display', 'table');
			}
			e.preventDefault();
		});
	}
}


(function ($, global) {
	"use strict";
	
	let quest = null

	namespace('nc.lineage');

	nc.lineage.quest = function (quest_data) {
		if (isNotDefined(quest_data)) throw new Error('nc.lineage.quest require data object');

		const tpl = `<div class="wrap-section-beginner">` +
			`<div class="wrap-section-top"><section class="section-top"><header><p class="copy__subtitle">${quest_data.server_name} 퀘스트</p><span class="copy__x"></span><h1 class="copy__title">퀘스트 정보</h1></header></section></div>` +
			`<div class="wrap-section-hunt">` +
				`<section class="section-hunt">` +
					`<article>` +
						`<div class="article-tab">` +
							`<ul class="tab">${quest_data.data.map( (item, index) => { return `<li class="${index == 0 ? 'on' : ''}"><a href="" data-lv="${index}">${item.class_name}</a></li>`; }).join('')}</ul>` +
						`</div>` +
						`<div class="article-hunt">` +
							`<div class="table-bundle">` +
								`<div class="table-bundle-row"></div>` +
							`</div>` +
						`</div>` +
					`</article>` +
				`</section>` +
			`</div>` +		
		`</div>`;
		$('#container .post-body.entry-content').prepend(tpl);

		quest = new Quest({
			wrap : $('.wrap-section-hunt .section-hunt .article-hunt .table-bundle .table-bundle-row'),
			data : quest_data.data
		}).init();
	};

	
}(jQuery, window));