/*build:2018-05-07,wangxiaokang,524920914@qq.com*/
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('Xpage', ['jquery'], factory);
    } else {
        var XHW = window.XHW = window.XHW || {};
        XHW.Xpage = factory(window.Zepto || window.jQuery || $);
    }
})(this, function ($) {
    function _runCb(cb, params, context) {
        if (cb && typeof cb === 'function') {
            cb.apply(context, params.join ? params : [params]);
        }
    }

    function varReplace(html, data) {
        var ret = html.replace(/{{([^}]*?)}}/gm, function (all, $1) {
            var ht = '';
            try {
                eval("ht = data." + $1);
            } catch (e) {
                return;
            }
            return ht != null ? ht : '';
        });
        return ret;
    }

    function Xpage(selector, opts) {
        if (this.constructor !== Xpage) {
            return new Xpage(selector, opts);
        }
        if (!opts) {
            opts = arguments[0];
            selector = '';
        }
        var xPage = this;
        xPage._showNextPage = null;
        xPage._destroyed = false;
        var defaults = {
            version: 1,
            noJson: false,
            mode: 'listView',
            nid: '11135737',
            item: 'li',
            pageSize: 10,
            maxPage: 500,
            moreButton: null,
            moreTip: null,
            pagination: null,
            scrollWrapper: null,
            moreButtonState: {
                isEmpty: '暂无数据',
                isHasMore: '查看更多',
                isLoading: '加载中...',
                isError: '出错，点击重试',
                isNoMore: '没有更多了'
            },
            moreTipState: {
                isEmpty: '暂无数据',
                isHasMore: '滚动到底部加载',
                isLoading: '加载中...',
                isError: '出错，请重试',
                isNoMore: '没有更多了'
            },
            paginationButtonText: {
                first: '&lt;&lt;',
                last: '&gt;&gt;',
                pre: '&lt;',
                next: '&gt;'
            },
            paginationMarkCount: 10,
            renderItem: function (item, index, list) {
                return "";
            }, renderItemAsyn: null,
            onInit: function (xpage) {}, onStatusChange: function (status) {}, onPageChange: function (page) {}, onPageRender: function (data) {}, onBeforePageRender: function (pageHtml) {}, onAfterPageRender: function (pageHtml) {}
        };
        var model = this.model = $.extend({}, defaults, opts);
        model.pageSize = model.pageSize > 200 ? 200 : model.pageSize;
        model.page = 0;
        model.total = 0;
        model.totalPage = 0;
        model.status = 1;
        model.$pageContainer = $(selector);
        model.$moreButton = $(model.moreButton);
        model.$moreTip = $(model.moreTip);
        model.$scrollWrapper = $(model.scrollWrapper);
        model.$pageItems = model.$pageContainer.find(model.item);
        model.$pagination = $(model.pagination);
        model.xyTotal = model.$pageItems.length || 0;
        model.xyPageCount = Math.ceil(model.xyTotal / model.pageSize);
        model.cache = [];
        model.setPage = function (page) {
            var
                model = this,
                totalPage = model.totalPage;
            model.page = Math.min(page, totalPage);
            model.setStatus();
            _runCb(xPage._routers[model.mode].onPageChange, model.page, xPage);
            _runCb(model.onPageChange, model.page, xPage);
        };
        model.setStatus = function (status) {
            var model = this;
            if (status !== undefined) {
                model.status = status;
            } else if (model.page < model.totalPage) {
                model.status = 1;
            } else {
                model.status = 4;
            }
            _runCb(xPage._routers[model.mode].onStatusChange, model.status, xPage);
            _runCb(model.onStatusChange, model.status, xPage);
        };
        model.setTotal = function (total) {
            var model = this,
                pageSize = model.pageSize;
            model.total = total;
            model.setTotalPage(Math.ceil(total / pageSize));
        };
        model.setTotalPage = function (count) {
            var model = this;
            model.totalPage = count;
            _runCb(xPage._routers[model.mode].onTotalPageChange, model.totalPage, xPage);
            _runCb(model.onTotalPageChange, model.totalPage, xPage);
        };
        this._init();
    }
    Xpage.tmpl = (function () {
        var cache = {};

        function tmpl(str, data) {
            var fn = !/\W/.test(str) ? cache[str] = cache[str] || tmpl(document.getElementById(str).innerHTML) : new Function("obj", "var p=[],print=function(){p.push.apply(p,arguments);};" + "with(obj){p.push('" +
                str.replace(/[\r\t\n]/g, " ").split("<%").join("\t").replace(/((^|%>)[^\t]*)'/g, "$1\r").replace(/\t=(.*?)%>/g, "',$1,'").split("\t").join("');").split("%>").join("p.push('").split("\r").join("\\'") + "');}return p.join('');");
            return data ? fn(data) : fn;
        }
        return tmpl;
    })();
    Xpage.prototype = {
        constructor: Xpage,
        _routers: {},
        _init: function () {
            var
                self = this,
                model = self.model,
                mode = model.mode;
            _runCb(self._routers[mode].onStatusChange, 2, self);
            model.$pageItems.remove();
            self._getAndSetTotal();
        }, _getAndSetTotal: function () {
            var self = this,
                model = self.model,
                pageSize = model.pageSize,
                xyPageCount = model.xyPageCount,
                xyTotal = model.xyTotal,
                maxPage = (model.maxPage < 500) ? (model.maxPage) : 500,
                mode = model.mode;
            if (model.noJson) {
                model.setTotal(Math.min(Math.max(xyTotal, 0), maxPage * pageSize));
                if (model.total === 0) {
                    model.setStatus(0);
                    return;
                }
                _runCb(model.onInit, self, self);
                self._routers[mode].render.call(self);
            } else {
                self._loadRemoteData(1, function (data) {
                    if (data.status == '-1') {
                        setEmpty();
                        return;
                    }
                    model.setTotal(Math.min(data.totalnum, maxPage * pageSize));
                    _runCb(model.onInit, self, self);
                    self._routers[mode].render.call(self);
                }, function (err) {
                    setEmpty();
                });
            }

            function setEmpty() {
                model.setStatus(0);
                model.setTotal(Math.max(xyTotal, 0));
            }
        }, getTotal: function () {
            return this.model.total;
        }, getTotalPage: function () {
            return this.model.totalPage;
        }, getPage: function () {
            return this.model.page;
        }, getStatus: function () {
            return this.model.status;
        }, goToPage: function (pageNum) {
            var self = this,
                model = self.model,
                totalPage = model.totalPage,
                mode = model.mode;
            pageNum = Math.min(Math.max(1, pageNum), totalPage);

            function onSuccess(data) {
                model.setPage(pageNum);
                _runCb(model.onBeforePageRender, data, self);
                _runCb(self._routers[mode].onPageRender, data, self);
                _runCb(model.onPageRender, data, self);
                _runCb(model.onAfterPageRender, data, self);
            }

            function onFail(err) {
                model.setStatus(3);
            }
            if (self.hasPage(pageNum)) {
                model.setStatus(2);
                if (self._isRenderByXy(pageNum)) {
                    self._renderByXY(pageNum, onSuccess);
                } else {
                    self._renderByJSON(pageNum, onSuccess, onFail);
                }
            }
        }, nextPage: function () {
            this.goToPage(this.model.page + 1);
        }, prePage: function () {
            this.goToPage(this.model.page - 1);
        }, firstPage: function () {
            this.goToPage(1);
        }, lastPage: function () {
            this.goToPage(this.model.totalPage);
        }, hasPage: function (pageNum) {
            var model = this.model,
                mode = model.mode,
                page = model.page,
                totalPage = model.totalPage,
                shouldLoad = false;
            if (pageNum <= model.totalPage && model.status !== 2 && pageNum !== page) {
                shouldLoad = true;
            }
            return shouldLoad;
        }, destroy: function () {
            var
                self = this,
                model = self.model,
                $container = model.$pageContainer,
                $scrollWrapper = model.$scrollWrapper,
                $pageItems = model.$pageItems,
                $pagination = model.$pagination,
                $moreButton = model.$moreButton,
                $moreTip = model.$moreTip,
                mode = model.mode,
                handle = self._showNextPage,
                hasXy = self._hasXy();
            switch (mode) {
            case 'listView':
                $moreButton.html('...');
                $moreButton.off('click', handle);
                break;
            case 'listView-scroll':
                $moreTip.html('...');
                $scrollWrapper.off('scroll', handle);
                break;
            case 'pageView':
                $pagination.html('...');
                $pagination.off('.click', handle);
                break;
            default:
                break;
            }
            $container.empty();
            if (hasXy) {
                $container.append($pageItems);
            }
            self.__destroyed = true;
        }, _renderByXY: function (pageNum, success) {
            var
                self = this,
                model = self.model,
                pageSize = model.pageSize,
                $pageItems = model.$pageItems,
                $itemsHTML = $pageItems.slice(pageSize * (pageNum - 1), pageSize * pageNum),
                listHtml = '';
            for (var i = 0; i < $itemsHTML.length; i++) {
                var item = $itemsHTML.get(i);
                listHtml += item.outerHTML;
            }
            setTimeout(function () {
                if (self.__destroyed) {
                    return;
                }
                _runCb(success, listHtml, self);
            }, 100);
        }, _renderByJSON: function (pageNum, success, fail) {
            var self = this,
                model = self.model,
                mode = model.mode,
                itemHtml, itemsHtmls = [],
                fishedCount = 0,
                listLen, render;
            this._loadRemoteData(pageNum, loadSuccess, LoadFail);

            function loadSuccess(data) {
                var items = data.data.list;
                _runCb(model.onData, [items], self);
                listLen = items.length;
                if (model.renderItemAsyn) {
                    for (var i = 0; i < listLen; i++) {
                        model.renderItemAsyn.call(self, items[i], i, items, renderItem(i, items[i]));
                    }
                } else {
                    for (var j = 0; j < listLen; j++) {
                        var itemHtml = varReplace(model.renderItem.call(self, items[j], j, items), items[j]);
                        itemsHtmls.push(itemHtml);
                    }
                    success(itemsHtmls.join(''));
                }
            }

            function LoadFail(err) {
                fail(err);
            }

            function renderItem(i, data) {
                return function renderHTML(itemHTML) {
                    itemsHtmls[i] = varReplace(itemHTML, data);
                    fishedCount++;
                    if (fishedCount === listLen) {
                        success(itemsHtmls.join(''));
                    }
                };
            }
        }, _loadRemoteData: function (pageNum, success, fail) {
            var
                self = this,
                model = self.model,
                ver = model.version,
                nid = model.nid,
                cnt = model.pageSize,
                attr = model.attr === undefined ? '' : model.attr,
                orderby = model.orderby === undefined ? 1 : model.orderby,
                tp = model.tp === undefined ? 1 : model.tp,
                pgnum = pageNum,
                url = (ver == 2 ? 'http://da.wa.news.cn/nodeart/page?' : 'http://qc.wa.news.cn/nodeart/list?'),
                listCahce = model.cache[pageNum - 1];
            if (listCahce) {
                return success({
                    "data": {
                        "list": listCahce
                    }
                });
            }
            url += ['nid=' + nid, 'pgnum=' + pgnum, 'cnt=' + cnt, 'attr=' + attr, 'tp=' + tp, 'orderby=' + orderby].join('&');
            $.ajax({
                type: 'GET',
                url: url,
                dataType: 'jsonp',
                success: function (data) {
                    if (self._destroyed) {
                        return;
                    }
                    if (data.data && data.data.list) {
                        model.cache[pageNum - 1] = data.data.list;
                    }
                    success(data);
                }, error: fail,
                context: this
            });
        }, _hasXy: function () {
            return this.model.xyPageCount > 0;
        }, _isRenderByXy: function (pageNum) {
            return pageNum <= this.model.xyPageCount;
        }
    };
    var raw = Xpage.prototype._routers.raw = {
        render: function () {
            var self = this,
                mode = self.model.mode;
            self.goToPage(1);
            self._routers[mode].listen && self._routers[mode].listen.call(self);
        }
    };
    var listView = Xpage.prototype._routers.listView = $.extend({}, raw, {
        listen: function () {
            var self = this,
                model = self.model;

            function showNextPage(e) {
                e.preventDefault();
                self.nextPage();
            }
            self._showNextPage = showNextPage;
            model.$moreButton.on('click', showNextPage);
        }, onPageRender: function (list) {
            this.model.$pageContainer.append(list);
        }, onStatusChange: function (status) {
            var
                tipText, self = this,
                model = self.model,
                $moreButton = model.$moreButton,
                moreButtonState = model.moreButtonState;
            switch (status) {
            case 0:
                tipText = moreButtonState.isEmpty;
                break;
            case 1:
                tipText = moreButtonState.isHasMore;
                break;
            case 2:
                tipText = moreButtonState.isLoading;
                break;
            case 3:
                tipText = moreButtonState.isError;
                break;
            case 4:
                tipText = moreButtonState.isNoMore;
                break;
            }
            $moreButton.html(tipText);
        }, onPageChange: function (page) {}
    });
    var listViewScroll = Xpage.prototype._routers['listView-scroll'] = $.extend({}, listView, {
        listen: function () {
            var t, self = this,
                model = self.model,
                isDefault = model.$scrollWrapper.length === 0;
            model.$scrollWrapper = isDefault ? $(window) : model.$scrollWrapper;

            function showNextPage(e) {
                clearTimeout(t);
                t = setTimeout(function () {
                    var
                        target = e.target,
                        scrollTop = isDefault ? document.body.scrollTop || document.documentElement.scrollTop : target.scrollTop,
                        clientHeight = isDefault ? document.documentElement.clientHeight : target.clientHeight,
                        scrollHeight = isDefault ? document.documentElement.scrollHeight : target.scrollHeight;
                    if (scrollHeight - clientHeight - scrollTop < 50) {
                        self.nextPage();
                    }
                }, 500);
            }
            self._showNextPage = showNextPage;
            model.$scrollWrapper.on('scroll', showNextPage);
        }, onStatusChange: function (status) {
            var
                tipText, self = this,
                model = self.model,
                $moreTip = model.$moreTip,
                moreTipState = model.moreTipState;
            switch (status) {
            case 0:
                tipText = moreTipState.isEmpty;
                break;
            case 1:
                tipText = moreTipState.isHasMore;
                break;
            case 2:
                tipText = moreTipState.isLoading;
                break;
            case 3:
                tipText = moreTipState.isError;
                break;
            case 4:
                tipText = moreTipState.isNoMore;
                break;
            }
            $moreTip.html(tipText);
        },
    });
    var pageView = Xpage.prototype._routers.pageView = $.extend({}, raw, {
        listen: function () {
            var self = this,
                model = self.model,
                totalPage = model.totalPage,
                $pagination = model.$pagination;
            pageView.makePagination.call(self, 1, totalPage, $pagination);

            function showNextPage(e) {
                e.preventDefault();
                var $target = $(e.target),
                    type = $target.data('type');
                switch (type) {
                case 'pager':
                    var pageNum = +$target.text();
                    self.goToPage(pageNum);
                    break;
                case 'pre':
                    self.prePage();
                    break;
                case 'first':
                    self.firstPage();
                    break;
                case 'next':
                    self.nextPage();
                    break;
                case 'last':
                    self.lastPage();
                    break;
                default:
                }
            }
            self._showNextPage = showNextPage;
            $pagination.on('click', showNextPage);
        }, onPageRender: function (list) {
            this.model.$pageContainer.html(list);
        }, onPageChange: function (page) {
            var self = this,
                model = self.model,
                totalPage = model.totalPage,
                $pagination = model.$pagination;
            pageView.makePagination.call(self, page, totalPage, $pagination);
        }, makePagination: function (page, totalPage, $pagination) {
            var self = this,
                model = self.model,
                perPagerNum = model.paginationMarkCount,
                pagers = [],
                singleDigit = page % perPagerNum,
                lowIndex = 1 + page - (singleDigit === 0 ? perPagerNum : singleDigit);
            for (var i = 0; i < perPagerNum && (lowIndex + i <= totalPage); i++) {
                var _page = lowIndex + i;
                if (_page === page) {
                    pagers.push(makePager(lowIndex + i, 'pagerActive'));
                } else {
                    pagers.push(makePager(lowIndex + i, 'pager'));
                }
            }
            if (page > 1) {
                pagers.unshift(makePager(null, 'pre'));
                pagers.unshift(makePager(null, 'first'));
            }
            if (page < totalPage) {
                pagers.push(makePager(null, 'next'));
                pagers.push(makePager(null, 'last'));
            }
            $pagination.html(pagers.join(''));

            function makePager(page, type) {
                var tpl = pageView.makeTpl.call(self);
                switch (type) {
                case 'pagerActive':
                case 'pager':
                    return tpl[type].replace('{{num}}', page);
                default:
                    return tpl[type];
                }
            }
        }, makeTpl: function () {
            var self = this,
                model = self.model,
                text = model.paginationButtonText,
                count = model.paginationMarkCount;
            return {
                first: ' <span class="xpage-pagination-first"><a data-type="first">' + text.first + '</a></span> ',
                last: ' <span class="xpage-pagination-last"><a data-type="last">' + text.last + '</a></span> ',
                pre: ' <span class="xpage-pagination-pre"><a data-type="pre">' + text.pre + ' </a></span> ',
                next: ' <span class="xpage-pagination-next"><a data-type="next">' + text.next + '</a></span> ',
                pager: ' <span class="xpage-pagination-pager"><a data-type="pager">{{num}}</a></span> ',
                pagerActive: ' <span class="xpage-pagination-pager xpage-pagination-pager-active"><a data-type="active">{{num}}</a></span> '
            };
        }
    });
    return Xpage;
});