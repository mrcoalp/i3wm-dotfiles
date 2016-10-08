//********************************************************************************************************
// FireShot - Webpage Screenshots and Annotations
// Copyright (C) 2007-2016 Evgeny Suslikov (evgeny@suslikov.ru)
//********************************************************************************************************

function LinksGrabber(root) {
    var
        curDoc = document,
        hiddenAttrName  = '__fireshotHiddenLink',
        hashAttrName    =  '__fireshotLinkId',

        getRectForImgLink = function (elem) {
            var style = curDoc.defaultView.getComputedStyle(elem, "");
            if (style && (style.getPropertyValue("overflow") === "hidden" ||
                style.getPropertyValue("overflow-y") === "hidden" || style.getPropertyValue("overflow-y") === "auto" || style.getPropertyValue("overflow-y") == "scroll" ||
                style.getPropertyValue("overflow-x") === "hidden" || style.getPropertyValue("overflow-x") === "auto" || style.getPropertyValue("overflow-x") == "scroll")
            )
                return undefined;
            else
                return getElementR(elem.children[0], root);
        },

        getElementR = function(elem, root) {
            var box = elem.getBoundingClientRect(),
                body = root == document ? root.body : root,
                docElem = root == document ? root.documentElement : root,
                scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop,
                scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft,
                top  = box.top +  scrollTop,
                left = box.left + scrollLeft;

            return { top: Math.round(top), left: Math.round(left), width: box.width, height: box.height }
        };

        return {
            collectedLinks  : [],

            markHiddenLinks : function() {
                var overflowContainers = [];
                var itr = curDoc.createNodeIterator(root, NodeFilter.SHOW_ELEMENT, null, false), current;
                while (current = itr.nextNode()) {
                    if (!current.childElementCount || current.tagName === "HTML" || current === root) continue;

                    if (current.offsetHeight < current.scrollHeight || current.offsetWidth < current.scrollWidth) {

                        var style = curDoc.defaultView.getComputedStyle(current, "");
                        // Здесь идеально было бы рассекать и проверять по двум осям раздельно.
                        // Т.е. в случае, если по X разрешено переполнение, а по Y нет, то горизонтальный элемент всё равно отфильтруется.
                        if (style && style.getPropertyValue("display") !== "none" &&
                            (style.getPropertyValue("overflow") === "hidden" ||
                            style.getPropertyValue("overflow-y") === "hidden" || style.getPropertyValue("overflow-y") === "auto" || style.getPropertyValue("overflow-y") == "scroll" ||
                            style.getPropertyValue("overflow-x") === "hidden" || style.getPropertyValue("overflow-x") === "auto" || style.getPropertyValue("overflow-x") == "scroll")

                        )
                            overflowContainers.push(current);
                    }
                }


                overflowContainers.forEach(function (elem) {
                    var parentRect = getElementR(elem, root);
                    //logToConsole(elem.id + " " + elem.getAttribute("class") + ':');
                    var l = elem.getElementsByTagName("a"), cntr = 0;
                    for (var i = 0; i < l.length; ++i) {
                        var link = l[i];
                        var rect = getElementR(link, root);
                        if (!rectsIntersected(parentRect, rect)) {
                            link.setAttribute(hiddenAttrName, 1);
                            ++cntr;

                        }
                    }
                    //logToConsole('filtered: ' + cntr);
                });
            //alert(overflowContainers.length);
            },

            createLinksSnapshot : function () {

                function isElementHidden(elem) {
                    var p = elem;

                    while (p && p != curDoc) {

                        var style = curDoc.defaultView.getComputedStyle(p, "");

                        if (style.visibility === "hidden" || style.display === "none" || style.opacity == 0)
                            return true;
                        p = p.parentNode;
                    }

                    return false;
                }

                function isAllowedLink(link) {
                    if (link.getAttribute(hiddenAttrName)) return false;

                    var href = link.href;
                    return (href && href !== "" && href !== "javascript:void(0)" && href.slice && href.slice(-1) !== "#" && !isElementHidden(link));
                }


                function collectRects(elem, output) {
                    var offset = getElementR(elem, root),
                        rects = elem.getClientRects(),
                        myBoundingClientRect = undefined;

                    if (rects.length === 1) {
                        var rect;
                        if (elem.children && elem.children.length > 0 && elem.children[0].tagName === "IMG" && (rect = getRectForImgLink(elem)))
                            output.push(rect);
                        else
                            output.push(offset);
                        return;
                    }

                    // Комплексная фигура здесь
                    for (var j = 0; j < rects.length; ++j) {
                        if (j === 0) { //noinspection JSValidateTypes
                            myBoundingClientRect = {left: rects[j].left, top: rects[j].top};
                        }
                        else {
                            if (rects[j].left < myBoundingClientRect.left) myBoundingClientRect.left = rects[j].left;
                            if (rects[j].top < myBoundingClientRect.top) myBoundingClientRect.top = rects[j].top;
                        }
                    }

                    if (!myBoundingClientRect) return;

                    var deltaX = offset.left - myBoundingClientRect.left, deltaY = offset.top - myBoundingClientRect.top;

                    /*var t;
                     if (rects.length === 1 && elem.childNodes.length >= 1 && (t = getRectForComplexLink(elem)))
                     rects = [t];*/

                    for (j = 0; j < rects.length; ++j)
                        output.push({left:rects[j].left + deltaX, top:rects[j].top + deltaY, width:rects[j].width, height:rects[j].height});
                }

                var links = root.getElementsByTagName('a');
                //var offsetX = curDoc.body.scrollLeft, offsetY = curDoc.body.scrollTop;
                for (var i = 0; i < links.length; ++i) {
                    var elem = links[i];
                    if (isAllowedLink(elem)) {

                        var box = elem.getBoundingClientRect();
                        if (box.left >= 0 && box.left < window.innerWidth &&
                                box.top >= 0 && box.top < window.innerHeight) {

                            var vRects = [];

                            collectRects(elem, vRects);

                            if (vRects.length !== 0) {

                                var id = elem.getAttribute(hashAttrName);
                                if (id) id = parseInt(id);
                                else {
                                    id = this.collectedLinks.length;
                                    elem.setAttribute(hashAttrName, id);
                                }

                                this.collectedLinks[id] = {e: elem, r: vRects};
                            }
                        }
                    }
                }
            },

            getLinks: function(msg, offsets) {
                var docW = msg.crop ? msg.cropRight - msg.cropLeft : msg.width,
                    docH = msg.crop ? msg.cropBottom - msg.cropTop : msg.height;
                msg.links = [];
                for (var i = 0; i < this.collectedLinks.length; ++i) {
                    var linkItem = this.collectedLinks[i], linkObject = this.collectedLinks[i].e;
                    if (!linkObject.getAttribute(hiddenAttrName)) {
                        var r = [];

                        for (var j = 0; j < linkItem.r.length; ++j) {
                            var
                                x1 = (linkItem.r[j].left - offsets.x),
                                y1 = (linkItem.r[j].top - offsets.y),
                                w = linkItem.r[j].width,
                                h = linkItem.r[j].height;

                            if (x1 >= docW || y1 >= docH) continue;

                            if (x1 < 0) {
                                w += x1;
                                x1 = 0;
                            }
                            if (y1 < 0) {
                                h += y1;
                                y1 = 0;
                            }

                            if (x1 + w > docW) w = docW - x1;
                            if (y1 + h > docH) h = docH - y1;

                            if (w > 0 && h > 0)
                                r.push([Math.round(x1 * msg.ratioW), Math.round(y1 * msg.ratioH), Math.round(w * msg.ratioW), Math.round(h * msg.ratioH)]);
                        }

                        if (r.length > 0)
                            msg.links.push({
                                a: linkObject.href,
                                r: r,
                                h: ""//linkObject.outerHTML
                            });
                    }
                    //else linkObject.removeAttribute(hiddenAttrName);
                    //linkObject.removeAttribute(zIndexAttrName);
                }

                logToConsole("links filtered: " + (this.collectedLinks.length - msg.links.length));
                logToConsole("links added: " + msg.links.length);
            },

            checkClickableLinks: function() {

                var x, y,
                    offsetX = curDoc.body.scrollLeft, offsetY = curDoc.body.scrollTop;

                for (var i = 0; i < this.collectedLinks.length; ++i) {
                    if (!this.collectedLinks[i].p) {
                        x = this.collectedLinks[i].r[0].left - offsetX;
                        y = this.collectedLinks[i].r[0].top - offsetY;

                        if (x < 0) x += this.collectedLinks[i].r[0].width;
                        if (y < 0) y += this.collectedLinks[i].r[0].height;


                        var elem;

                        if (y >= 0 && y <= window.innerHeight && x >= 0 && x <= window.innerWidth)
                            if (!(((elem = document.elementFromPoint(Math.round(x + 0.5), Math.round(y + 0.5))) === this.collectedLinks[i].e || (elem && this.collectedLinks[i].e.contains(elem)))))
                                this.collectedLinks[i].e.setAttribute(hiddenAttrName, 1);
                    }
                }
            },

            clearAttributes: function() {
                var links = root.getElementsByTagName('a');
                for (var i = 0; i < links.length; ++i) {
                    links[i].removeAttribute(hiddenAttrName);
                    links[i].removeAttribute(hashAttrName);
                }
            }
    };
}


/*function markOverlappedLinks() {
 function getZIndex(elem) {
 var result = elem.getAttribute(zIndexAttrName);
 if (result) return parseInt(result);

 var zIndex = 0;
 var p = elem;

 while (p && p != curDoc) {

 var style = curDoc.defaultView.getComputedStyle(p, ""),
 z = parseInt(style.getPropertyValue('z-index'));
 if (z > 0)  {
 var position = style.getPropertyValue('position');
 if (position === 'fixed' || position === 'absolute' || position === 'relative') {
 zIndex = z;
 break;
 }
 }
 p = p.parentNode;
 }

 elem.setAttribute(zIndexAttrName, zIndex);
 return zIndex;
 }

 function getTopElements() {
 var result = [];

 //noinspection JSUnresolvedVariable
 var itr = curDoc.createNodeIterator(curDoc.documentElement, NodeFilter.SHOW_ELEMENT, null, false), current;
 while ((current = itr.nextNode()) != null)
 {
 if (current === curDoc.body || (current.clientWidth >= window.innerWidth - 32 && current.clientHeight >= window.innerHeight - 32)) continue;
 var style = curDoc.defaultView.getComputedStyle(current, "");

 if (style && (style.getPropertyValue("position") == "absolute" || style.getPropertyValue("position") == "relative" || (style.getPropertyValue("position") == "fixed" && (true || style.getPropertyValue("z-index") != "")
 ))) {
 var elemExt = getElementExtents(current);
 if (elemExt.w >= window.innerWidth * 0.5 || elemExt.h >= window.innerHeight * 0.5)
 {
 logToConsole(current.id + " " + current.getAttribute("class"));
 result.push(current);
 }
 }
 }
 return result;
 }


 function intersectRectsWithRect(rects, parentRect) {
 var result = [];
 rects.forEach(function(rect) {
 var intersection = difference(rect, parentRect);
 intersection.forEach(function(rect) {
 if (rect.width > 1 && rect.height > 1)
 result.push(rect);
 });
 });

 return result;
 }

 getTopElements().forEach(function (elem) {
 var parentRect = getElementR(elem),
 elementZIndex = undefined;
 logToConsole(elem.id + " " + elem.getAttribute("class") + ':');
 logToConsole(elem);

 for (var i = 0; i < this.collectedLinks.length; ++i) {
 var link = this.collectedLinks[i].e;

 if (link.getAttribute(hiddenAttrName) || elem.contains(link)) continue;
 var rect = getElementR(link);
 if (rectsIntersected(parentRect, rect)) {
 if (!elementZIndex) elementZIndex = getZIndex(elem);
 if (getZIndex(link) <= elementZIndex) {
 var newRects = intersectRectsWithRect(this.collectedLinks[i].r, parentRect);
 logToConsole("intersect: " + link);
 if (newRects.length > 0)
 this.collectedLinks[i].r = newRects;
 else {
 link.setAttribute(hiddenAttrName, 1);
 logToConsole('overlapped: ' + link.id + " " + link.href);
 logToConsole(link);
 }
 }
 }
 }

 //elem.removeAttribute(zIndexAttrName);
 });
 }*/

/* function filterElements(links) {
 var result = [];
 for (var i = 0; i < links.length; ++i) {
 if (links[i].getAttribute(hiddenAttrName)) continue;

 var href = links[i].href;
 if (href && href.slice(-1) !== "#" && href !== "" && href !== "javascript:void(0)")
 {
 if (!isElementHidden(links[i]))
 result.push(links[i]);
 }
 }
 return result;
 }*/

/* function getRectForComplexLink(elem) {
 var totalRect = undefined;

 for (var i = 0; i < elem.childNodes.length; ++ i) {
 if (!elem.childNodes[i].getClientRects) continue;
 var rects = elem.childNodes[i].getClientRects();
 for (var j = 0; j < rects.length; ++j) {
 if (!totalRect)
 totalRect = {left: rects[j].left, top: rects[j].top, width:rects[j].width, height:rects[j].height};
 else {
 if (rects[j].left < totalRect.left) totalRect.left = rects[j].left;
 if (rects[j].top < totalRect.top) totalRect.top = rects[j].top;
 if (rects[j].left + rects[j].width > totalRect.left + totalRect.width) totalRect.width = rects[j].width;
 if (rects[j].top + rects[j].height > totalRect.top + totalRect.height) totalRect.height = rects[j].height;
 }
 }
 }
 return totalRect;
 }*/
