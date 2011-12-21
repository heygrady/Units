(function(window, document, body) {
    'use strict';
    
    // a body element is required for this to work
    // TODO: there's probably a way to not need a body, or create one
    if (!body) { return; }

    var Length = window.Length = {},

        absoluteUnits = ['mm', 'cm', 'pt', 'pc', 'in', 'mozmm', 'rem', 'vh', 'vw', 'vm'],
        absoluteValues = [1/25.4, 1/2.54, 1/72, 12/72],
        conversions = {},
        i = absoluteUnits.length,
        len = i,
        testElem = document.createElement('testunit'),
        testStyle = testElem.style,
        testProp = 'width',
        runits = /^([\+\-]=)?(-?[\d+\.\-]+)([a-z]+|%)(.*?)$/i,
        round = Math.round,
        _toPx = 'ToPx',
        _fontSize = 'fontSize',
        _fontFamily = 'fontFamily',
        addEvent = window.addEventListener,
        multiplier = 1000,
        parseValue,
        floatNum = parseFloat; // IE9 gets weird with a multiplier over 1000
    
    // add the test element to the page
    body.appendChild(testElem);

    // make sure it's display block
    //testStyle.display = 'block';

    // make sure it's invisible
    testStyle.position = 'absolute';
    testStyle.height = 0;
    //testStyle.overflow = 'hidden';
    //testStyle.clip = 'rect(0 0 0 0)';
    
    // find the css value of a property on an element
    function cssValue (elem, prop, useOffset) {
        var value,
            computedStyle = window.getComputedStyle;
        if (computedStyle) {
            value = computedStyle(elem)[prop];
        } else {
            // IE won't convert absolute units
            if (prop === testProp && useOffset) {
                // if we're testing, then just ask for the offsetWidth
                value = elem.offsetWidth + 'px';
            } else {
                // grab the raw value
                value = elem.currentStyle[prop];

                // use the raw value or correct for absolute units
                value = useOffset ? value : Length.toPx(value) + 'px';
            }
        }
        return value;
    }

    // find the conversion of a unit to px
    function pixelsPerUnit (unit) {
        var value;

        // try to get a value from the test element
        // IE8 and below throw exceptions when setting unsupported units
        try {
            // most browsers return whole numbers, we need a few decimals to ensure useful conversions
            // the multiplier ensures at least three decimals of precision
            testStyle[testProp] = multiplier + unit;
            value = cssValue(testElem, testProp, 1);
        } catch(e) {
            value = 0;
        }
        testStyle[testProp] = 0; // reset it
        return floatNum(value)/multiplier;
    }

    // find and save the conversion of an absolute ratio to pixels
    // we're pretending that rem
    function testAbsoluteUnit(i) {
        // All real absolute units are relative to inches
        // 1 inch is usually 96px but it isn't always
       conversions[absoluteUnits[i] + _toPx] = i < 4 ? absoluteValues[i] * conversions['in' + _toPx] : pixelsPerUnit(absoluteUnits[i]);
    }

    // loop through the absolute units and measure them
    // TODO: rem is being treated as a static conversion even though it will change if the body font-size ever changes
    // NOTE: absolute units need to be looked up because of screen DPI
    while (i--) { testAbsoluteUnit(i); }

    // The vm, vh, vw units need to be recalculated on window.resize (in browsers that support them)
    // vm, vh, vw will be 0 in unsupported browsers
    if (addEvent && Length.vh) {
        addEvent('resize', function() {
            i = len;
            while (i-- > len - 3) { testAbsoluteUnit(i); }
        });
    }

    parseValue = Length.parseValue = function (string) {
        // handle side-based percentage keywords (used in background-position and transition-origin)
        switch(string) {
            case 'left': // no break
            case 'top':
                string = '0%';
                break;
            case 'right': // no break
            case 'bottom':
                string = '100%';
                break;
            case 'center':
                string = '50%';
        }

        var matches = string.match(runits);
        // TODO: matches[4] holds other values that are potentially in a list
        return {
            prefix: matches[1],
            value: matches[2],
            unit: matches[3]
        };
    };

    // TODO: handle list values like margin and padding
    Length.toPx = function (value, element) {
        // overloading
        // TODO: won't work with unitless numbers
        if (!value.unit) {
            value = parseValue(value);
        }

        var val = value.value,
            unit = value.unit,
            ratio = conversions[unit + _toPx],
            fontSize;

        if (unit === 'px') {
            ratio = 1;
        } else if (!ratio && element) {
            // font-relative units require the containing element
            fontSize = cssValue(element, _fontSize);

            if (unit === 'em') {
                // em is easy-ish
                ratio = floatNum(fontSize);
            } else {
                // ex and ch require measuring actual letters in the font
                // copy the font-size and font-style
                testStyle[_fontSize] = fontSize;
                testStyle[_fontFamily] = cssValue(element, _fontFamily, 1);

                // return the conversion
                ratio = pixelsPerUnit(unit);
            }
        }

        // when ratio fails, likely an unsupported unit or percentage was supplied
        return ratio ? round(val*ratio) : 0;
    };

    // NOTE: percentages are calculated differently per property
    // TODO: it would be possible to calculate for most common properties, like height, width, top, bottom, margin, padding, etc
    Length.percentageToPx = function (value, relativeValue) {
        // overloading
        // TODO: won't work with unitless numbers
        if (!value.unit) {
            value = parseValue(value);
        }
        
        // percentages are easy with a relative value
        // or conversion failed, likely a non-percentage unit was supplied
        return value.unit === '%' ? floatNum(relativeValue) * value.value / 100 : false;
    };
})(this, this.document, this.document.body);

