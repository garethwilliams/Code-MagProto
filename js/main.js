// world's smallest jQuery plugin :)
jQuery.fn.reverse = [].reverse;

var ARTICLEPREVIEWS = (function () {
    function arrangeArticlePreviewLayout() {
        // cache article previews
        var $articlePreviews = getArticlePreviews();
        var articlePreviewCount = $articlePreviews.length;
        
        if (!articlePreviewCount) {
            return;
        }
        
        // reset all top margins
        $articlePreviews.css('margin-top', 0);
    
        // figure out how many items are in a row
        var currentElementTop, previousElementTop;
        var itemsPerRow = 0;
        for (var index = 0; index < articlePreviewCount; index++) {
            currentElementTop = $($articlePreviews.get(index)).offset().top;
            // starting a new row
            if (previousElementTop !== undefined && currentElementTop !== previousElementTop) {
                itemsPerRow = index;
                break;
            }
            previousElementTop = currentElementTop;
        }
        
        // if there is only 1 item per row we can stop now
        if (itemsPerRow === 1) {
            return;
        }
        
        // move items as necessary
        var rowCount = Math.ceil($articlePreviews.length / itemsPerRow);
        for (var row = 1; row < rowCount; row++) {
            for (var item = 0; item < itemsPerRow; item++) {
                var $currentItem = $($articlePreviews.get(itemsPerRow * row + item));
                var $itemAboveCurrentItem = $($articlePreviews.get(itemsPerRow * (row - 1) + item));
                var itemAboveCurrentItemMarginTop = parseInt($itemAboveCurrentItem.css('margin-top'));
                var itemAboveCurrentItemBottomX = $itemAboveCurrentItem.offset().top + $itemAboveCurrentItem.outerHeight(true) + Math.abs(itemAboveCurrentItemMarginTop);
                var currentItemOffsetTop = $currentItem.offset().top;
                if (itemAboveCurrentItemBottomX < currentItemOffsetTop) {
                    $currentItem.css('margin-top', (itemAboveCurrentItemBottomX - currentItemOffsetTop) + 'px');
                }
            }
        }
    };
    
    function getArticlePreviews() {
        return $('.article-preview');
    };

    function isArticlePreviewPage() {
        return getArticlePreviews().length > 0;
    };
    
    var pub = {
        arrangeArticlePreviewLayout: arrangeArticlePreviewLayout,
        isArticlePreviewPage: isArticlePreviewPage
    };
    
    return pub;
})();

var ARTICLEIMAGES = function() {
    var _$articleImageWrappers;
    function getArticleImageWrappers() {
        return _$articleImageWrappers || (_$articleImageWrappers = $('.article-main-copy > .figure'));
    };
    
    function isPageWithArticleImages() {
        return getArticleImageWrappers().length > 0;
    };
    
    function performResponsiveLayoutChanges() {
        // image wrapper widths must be set to the width of the image itself so that the little icon and the image caption line up nicely with the image.
        var $el, imageWidth;
        getArticleImageWrappers().each(function(idx, el) {
            $el = $(el);
            $el.css('width', 'auto');
            imageWidth = $el.find('.article-image').width();
            if (imageWidth !== $el.width()) {
                $el.css('width', imageWidth + 'px');
            }
        });
    };
    
    var pub = {
        isPageWithArticleImages: isPageWithArticleImages,
        performResponsiveLayoutChanges: performResponsiveLayoutChanges
    };
    return pub;
}();

var ARTICLESIDEBAR = function() {
    
    var cachedOffsetTopKey = 'cached-offset-top';
    var cachedOuterHeightKey = 'cached-outer-height';
    var cssMaxTopKey = 'css-max-top';
    var cssMinTopKey = 'css-min-top';
    var fixedCssClass = 'fixed';
    var scrollEventName = 'scroll.articleSidebar';
    
    function ensureNoContentOverlaps() {
        var $el, currentElPositionTop, previousElBottomX;
        getSidebarContentItems().each(function (idx, el){
            $el = $(el);
            currentElPositionTop = $el.position().top;
            if (previousElBottomX && currentElPositionTop < previousElBottomX) {
                $el.css('top', previousElBottomX + 'px');
                currentElPositionTop = $el.position().top;
            }
            previousElBottomX = currentElPositionTop + $el.outerHeight(true);
        });
    };
    
    function fixToTopOnScrollOff() {
        $(window).off(scrollEventName);
    };
    
    function fixToTopOnScrollOn() {
        var events = $._data(window, 'events');
        if (events === undefined || (events !== undefined && events[scrollEventName] === undefined)) {
            $(window).on(scrollEventName, setSidebarItemPositions);
        }
    };
    
    var _$sideBarContentItems;
    function getSidebarContentItems() {
        return _$sideBarContentItems || (_$sideBarContentItems = $('.pullToSide'));
    };
    
    function isContentPulledIntoSidebar() {
        return getSidebarContentItems().css('position') === 'absolute' || getSidebarContentItems().css('position') === 'fixed';
    };
    
    function performResponsiveLayoutChanges () {
        resetResponsiveChanges();
        if (isContentPulledIntoSidebar()) {
            ensureNoContentOverlaps();
            setSidebarItemMinMaxTopValues();
            fixToTopOnScrollOn();
            setSidebarItemPositions();
        } else {
            fixToTopOnScrollOff();
        }
    };
    
    function resetResponsiveChanges() {
        getSidebarContentItems().css({ 'left': '', 'top': '', 'width': '' }).filter('.' + fixedCssClass).removeClass(fixedCssClass);
    };
    
    function setSidebarItemMinMaxTopValues() {
        // cache some dimension and position values as well as determing the minimum- and maximum-top values for each sidebar item
        var $el, currentElMinTop, previousElMinTop;
        getSidebarContentItems().reverse().each(function (idx, el) {
            // jQuerify the element
            $el = $(el);
            
            // cache dimensions
            $el.data(cachedOuterHeightKey, $el.outerHeight(true));
            
            // cache position
            var topMargin = $el.css('margin-top');
            if (topMargin !== undefined) {
                if (topMargin.indexOf('px') === -1 && topMargin !== 0 && topMargin !== '0') {
                    console.log('Article sidebar items need to have their top margins declared in pixels.');
                    topMargin = 0;
                } else {
                    topMargin = parseFloat(topMargin);
                }
            }
            $el.data(cachedOffsetTopKey, $el.offset().top - topMargin);
            
            // store min top value
            currentElMinTop = $el.css('top') === 'auto' ? $el.position().top : parseFloat($el.css('top'));
            $el.data(cssMinTopKey, currentElMinTop);
            
            // store max top value
            if (previousElMinTop === undefined) {
                var $mainArticleCopy = $('.article-main-copy');
                $el.data(cssMaxTopKey, $mainArticleCopy.position().top + $mainArticleCopy.outerHeight(true) - $el.data(cachedOuterHeightKey));
            } else {
                $el.data(cssMaxTopKey, previousElMinTop - $el.data(cachedOuterHeightKey));
            }
            
            // stuff for the next element
            previousElMinTop = currentElMinTop;
        }).reverse(); // return sidebar items to their normal order
    };
    
    // set the position of sidebar items so they are displayed how we want (e.g. 'current' item in fixed position, etc.)
    function setSidebarItemPositions() {
        var $el, currentElementOffsetTop;
        var scrollTop = $(window).scrollTop();
        getSidebarContentItems().each(function (idx, el) {
            $el = $(el);
            currentElementOffsetTop = $el.data(cachedOffsetTopKey);
            // if the top of the 'natural position' of this element is scrolled out of view
            if (currentElementOffsetTop < scrollTop) {
                // if we can fix the element without messing with any below it
                if (scrollTop < currentElementOffsetTop + ($el.data(cssMaxTopKey) - $el.data(cssMinTopKey))) {
                    if (!$el.hasClass(fixedCssClass)) {
                        var leftMargin = $el.css('margin-left');
                        if (leftMargin !== undefined) {
                            if (leftMargin.indexOf('px') === -1 && leftMargin !== 0 && leftMargin !== '0') {
                                console.log('Article sidebar items need to have their left margins declared in pixels.');
                                leftMargin = 0;
                            } else {
                                leftMargin = parseFloat(leftMargin);
                            }
                        }
                        $el.css({ 'left': $el.offset().left - leftMargin, 'width': $el.width() });
                        $el.addClass(fixedCssClass);
                    }
                    if ($el.css('top') !== '0') {
                        $el.css('top', '0');
                    }
                } else {
                    if ($el.hasClass(fixedCssClass)) {
                        $el.removeClass(fixedCssClass);
                        $el.css({ 'left': '', 'width': '' });
                    }
                    if ($el.css('top') !== $el.data(cssMaxTopKey) + 'px') {
                        $el.css('top', $el.data(cssMaxTopKey) + 'px');
                    }
                }
            } else {
                if ($el.hasClass(fixedCssClass)) {
                    $el.removeClass(fixedCssClass);
                    $el.css({ 'left': '', 'width': '' });
                }
                if ($el.css('top') !== $el.data(cssMinTopKey) + 'px') {
                    $el.css('top', $el.data(cssMinTopKey) + 'px');
                }
            }
        });
    };
    
    var pub = {
        performResponsiveLayoutChanges: performResponsiveLayoutChanges
    };
    return pub;
}();

$(window).one('load', function() {
    if (ARTICLEPREVIEWS.isArticlePreviewPage()) {
        ARTICLEPREVIEWS.arrangeArticlePreviewLayout();
        $(window).on('resize', ARTICLEPREVIEWS.arrangeArticlePreviewLayout);
    }
    if (ARTICLEIMAGES.isPageWithArticleImages()) {
        ARTICLEIMAGES.performResponsiveLayoutChanges();
        ARTICLESIDEBAR.performResponsiveLayoutChanges();
        $(window).on('resize', function () {
            ARTICLEIMAGES.performResponsiveLayoutChanges();
            ARTICLESIDEBAR.performResponsiveLayoutChanges();
        });
    }
});