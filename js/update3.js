const pageCnbType = 1;
const pageCnbSubType = 2;
includeCSS('https://cdn.jsdelivr.net/gh/cckiss/blog/css/l1.board4.css');
class Update {
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

		function tmpl_item (item) {
			return `<tr class="ng-scope">` +
              			`<td class="ng-binding normalFrontIcon">업데이트</td>` +
              			`<td class="subject"><a class="ng-binding">${item.title}</a><span class="arrowQ"></span><div class="detailFaq"><div class="normalContent">${item.content}</div></div></td>` +
              			`<td class="ng-binding writer"><img src="https://cdn.jsdelivr.net/gh/cckiss/web/img/lineage_writer.png" alt=""></td>` +
        			`</tr>`;
		}

		let tmpl = `<div class="wrap_contents ng-scope"><div class="ng-scope" id="custom_main"><table class="table_list ng-scope"><tbody>${_.option.data.map( (item, index) => { return tmpl_item(item); }).join('')}</tbody></table></div></div>`;
		_.option.wrap.empty().append(tmpl);
		_.addEvent();
	}

	addEvent() {
		$('.subject').on('click', function(e) {
              		var detail = $(this).children('.detailFaq');
              		var arrow = $(this).children('.arrowQ');
              		if (detail.hasClass('selected') ) {
                			detail.removeClass('selected');
                  			detail.slideUp();
                  			arrow.removeClass('selected');
               		} else {
                			detail.addClass('selected');
                  			detail.slideDown();
                  			arrow.addClass('selected');
                		}
            	});
	}
}


(function ($, global) {
	"use strict";
	
	let update = null

	namespace('nc.lineage');

	nc.lineage.update = function (option) {
		if (isNotDefined(option)) throw new Error('nc.lineage.update require data object');

		update = new Update(option).init();
	};

	
}(jQuery, window));