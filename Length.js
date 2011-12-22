(function(document, undefined){
"use strict";

// create an element to test with
var testElem = document.createElement('test'),
    convert = {},
    units = ['mm', 'cm', 'pt', 'pc', 'in', 'mozmm'],
    conversions = [1/25.4, 1/2.54, 1/72, 1/6],
    i = 6, //units.length,
    runit = /^(-?[\d+\.\-]+)([a-z]+|%)$/i,
    rem = /r?em/,
    docElement = document.documentElement,
    defaultView = document.defaultView,
    getComputedStyle = defaultView && defaultView.getComputedStyle,
    defaultProp = 'left',
    _font = 'font',
    _fontSize   = _font + 'Size',
    _fontFamily = _font + 'Family',
    _fontWeight = _font + 'Weight',
    _fontStyle  = _font + 'Style',
    _px = 'px',
    _toPx = 'ToPx',
    _parseFloat = parseFloat;

// make sure our element is position absolute
testElem.style.position = 'absolute';

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
        unit = getUnit(value),
        conversion = unit === _px ? 1 : convert[unit + _toPx];
    
    // return known conversions immediately
    if (conversion || rem.test(unit) && !force) {
        conversion = conversion || _parseFloat(curCSS(unit === 'rem' ? docElement : prop === _fontSize ? elem.parentNode : elem, _fontSize));
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
        console.log(styleElem);
        // read the computed/used value
        // if we couldn't convert it, return 0
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
function curCSS(elem, prop, raw) {
    var value,
        pixel,
        unit;
    if (getComputedStyle) {
        // FireFox, Chrome/Safari, Opera and IE9+
        value = getComputedStyle(elem)[prop];

        // chrome returns percentages in many cases, this fixes common cases like margin, padding, left and right
        // TODO: top and bottom would still be wrong
        // TODO: firefox passes values straight through when they can't be applied, like applying top to a postionion static element
        // @see http://bugs.jquery.com/ticket/10639
        if (getUnit(value) === '%') {
            value = toPx(elem, value, 'width', 1);
        } else if (value === 'auto') {
            value = 0;
        }
    } else if (prop === _fontSize) {
        // correct IE issues with font-size
        // @see http://bugs.jquery.com/ticket/760
        value = toPx(elem, '1em', defaultProp, 1);
    } else {
        // IE won't convert units for us
        // Ask for a property that always returns pixels, or grab the raw value
        pixel = elem.style['pixel' + prop.charAt(0).toUpperCase() + prop.substr(1)];
        value = pixel ? pixel + _px : elem.currentStyle[prop];
        unit = getUnit(value);

        // if IE returned us a non-px unit, convert it using the default property
        // TODO: this will return incorrect results for percentages in many cases
        if (!raw && unit && unit !== _px) {
            value = toPx(elem, value) + _px;
        }
    }
    return value;
}

function getUnit(value) {
    return (value.match(runit)||[])[2];
}

// explose the conversion function to the window object
window.Length = {
    toPx: toPx
}
}(this.document));