(function(document, undefined){
"use strict";

// create an element to test with
var testElem = document.createElement('test'),
    testStyle = testElem.style,
    convert = {},
    units = ['mm', 'cm', 'pt', 'pc', 'in', 'mozmm'],
    conversions = [1/25.4, 1/2.54, 1/72, 1/6],
    i = 6, //units.length,
    runit = /^(-?[\d+\.\-]+)([a-z]+|%)$/i,
    rem = /r?em/,
    rvpos = /^top|bottom/,
    docElement = document.documentElement,
    defaultView = document.defaultView,
    getComputedStyle = defaultView && defaultView.getComputedStyle,
    defaultProp = 'left',
    marginBug,

    // shorten some repeated strings
    _font = 'font',
    _fontSize   = _font + 'Size',
    _fontFamily = _font + 'Family',
    _fontWeight = _font + 'Weight',
    _fontStyle  = _font + 'Style',
    _padding = 'padding',
    _border = 'border',
    _Top = 'Top',
    _Bottom = 'Bottom',
    _marginTop = 'margin' + _Top,
    _px = 'px',
    _toPx = 'ToPx',
    _parseFloat = parseFloat;

// make sure our test element is position absolute
testStyle.position = 'absolute';

// test for the WebKit margin bug
if( getComputedStyle ) {
    testStyle[_marginTop] = '1%';
    marginBug = getComputedStyle( testElem )[_marginTop] !== '1%';
}

// loop our absolute units
while(i--) {
    convert[units[i] + _toPx] = conversions[i] ? conversions[i] * convert.inToPx : toPx(testElem, '1' + units[i]);
}

// convert a value to pixels
function toPx(elem, value, prop, force) {
    prop = prop || defaultProp;
    var style,
        styleVal,
        styleElem,
        ret = _parseFloat(value),
        unit = (value.match(runit)||[])[2],
        conversion = unit === _px ? 1 : convert[unit + _toPx];
    
    // return known conversions immediately
    if (conversion || rem.test(unit) && !force) {
        styleElem = unit === 'rem' ? docElement : prop === _fontSize ? elem.parentNode : elem;
        conversion = conversion || _parseFloat(curCSS(styleElem, _fontSize));
        ret = ret * conversion;
    } else {
        // percentages are relative by prop on the actual element
        styleElem = unit === '%' ? elem : testElem;
        style = styleElem.style;

        // copy the font to the test element
        if (unit === 'ch' || unit === 'ex') {
            style[_fontSize]   = curCSS(elem, _fontSize);
            style[_fontFamily] = curCSS(elem, _fontFamily);
            style[_fontWeight] = curCSS(elem, _fontWeight);
            style[_fontStyle]  = curCSS(elem, _fontStyle);
        }

        // capture the current value
        styleVal = style[prop];

        // set the style on the target element
        try {
            style[prop] = value;
        } catch(e) {
            // IE 8 and below won't accept nonsense units
            return 0;
        }

        // add the test element to the DOM
        if (styleElem === testElem) { docElement.appendChild(styleElem); }

        // read the computed/used value
        // if style is nothing the browser didn't accept whatever we set, return 0
        ret = !style[prop] ? 0 : _parseFloat(curCSS(styleElem, prop));

        // yank the test element out of the dom
        // (because people will complain if they see in in their inspector, otherwise it doens't hurt anything)
        if (elem !== testElem && styleElem === testElem) { docElement.removeChild(styleElem); }

        // restore the property we were testing
        style[prop] = styleVal !== undefined ? styleVal : null;
    }

    return ret;
}

// return the computed value of a CSS property
function curCSS(elem, prop) {
    var value,
        pixel = elem.style['pixel' + prop.charAt(0).toUpperCase() + prop.slice(1)],
        unit,
        parent,
        innerHeight,
        outer = [
            _padding + _Top,
            _padding + _Bottom,
            _border + _Top,
            _border + _Bottom
        ],
        i=4;
    if (pixel) {
        value = pixel + _px;
    } else if (getComputedStyle) {
        // FireFox, Chrome/Safari, Opera and IE9+
        value = getComputedStyle(elem)[prop];
    } else if (prop === _fontSize) {
        // correct IE issues with font-size
        // @see http://bugs.jquery.com/ticket/760
        value = toPx(elem, '1em', defaultProp, 1) + _px;
    } else {
        // IE won't convert units for us
        value = elem.currentStyle[prop];
    }
    
    // doctor the values if we got something weird
    unit = (value.match(runit)||[])[2];
    if (unit === '%' && marginBug) {
        // WebKit won't convert percentages for top, bottom, left, right and margin
        if (rvpos.test(prop)) {
            // Top and bottom requires measuring the innerHeigt of the parent.
            innerHeight = (parent = elem.parentNode || elem).offsetHeight;
            while (i--) {
              innerHeight -= _parseFloat(curCSS(parent, outer[i]));
            }
            value = _parseFloat(value) / 100 * innerHeight + _px;
        } else {
            // This fixes margin, left and right
            // @see https://bugs.webkit.org/show_bug.cgi?id=29084
            // @see http://bugs.jquery.com/ticket/10639
            value = toPx(elem, value, 'width', 1);
        }

    } else if (value === 'auto' || (unit !== _px && getComputedStyle)) {
        // WebKit and Opera will return auto in some cases when a valid value can't be set on a specific property
        // Firefox will pass back an unaltered value when it is valid but can't be set for that element, like top on a static element
        value = 0;
    }else if (unit && unit !== _px) {
        // IE might return a non-px unit, convert it using the default property
        // TODO: this will return incorrect results for percentages in some cases
        value = toPx(elem, value) + _px;
    }
    return value;
}

// explose the conversion function to the window object
window.Length = {
    toPx: toPx
}
}(this.document));