(function(window, document, body) {
    'use strict';
    
    // a body element is required for this to work
    // TODO: there's probably a way to not need a body, or create one
    if (!body) { return; }

    var Length = window.Length = {},
        absoluteUnits = ['px', 'mm', 'cm', 'in', 'pt', 'pc', 'mozmm', 'rem', 'vh', 'vw', 'vm'],
        i = absoluteUnits.length,
        testElem = document.createElement('testunit'),
        testStyle = testElem.style,
        testProp = 'width',
        runits = /^([\+\-]=)?(-?[\d+.\-]+)([a-z]+|%)(.*?)$/i, // support jQuery animate prefixes and lists
        rnumpx = /^-?\d+(?:px)?$/i,
        round = Math.round,
        multiplier = 1000; // IE9 gets weird with a multiplier over 1000
    
    // add the test element to the page
    body.appendChild(testElem);

    // make sure it's display block
    testStyle.display = 'block';

    // make sure it's invisible
    testStyle.position = 'absolute';
    testStyle.height = 0;
    testStyle.overflow = 'hidden';
    testStyle.clip = 'rect(0 0 0 0)';
    
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
        return parseFloat(value)/multiplier;
    }

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

    // find and save the conversion of an absolute ratio to pixels
    function testAbsoluteUnit(i) {
        Length[absoluteUnits[i]] = pixelsPerUnit(absoluteUnits[i]);
    }

    // loop through the absolute units and measure them
    // TODO: rem is being treated as a static conversion even though it will change if the body font-size ever changes
    // NOTE: absolute units need to be looked up because of wild browser inconsistencies
    while (i--) { testAbsoluteUnit(i); }

    // The vm, vh, vw units need to be recalculated on window.resize (in browsers that support them)
    // vm, vh, vw will be 0 in unsupported browsers
    var addEvent = window.addEventListener;
    if (addEvent && Length.vw) {
        addEvent('resize', function() {
            var i = absoluteUnits.length,
                len = i - 3; // vm, vh, vw are the last 3 in the array so the first 3 to test
            while (i-- > len) { testAbsoluteUnit(i); }
        });
    }

    Length.parseValue = function (string) {
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
        if (typeof value === "string") {
            value = Length.parseValue(value);
        }

        var testValue,
            val = value.value,
            unit = value.unit,
            unitToPx = unit + 'ToPx', style;

        if (Length[unit]) {
            // an absolute unit, we've got those ready
            return round(val*Length[unit]);
        } else if (typeof element === 'object') {
            // font-relative units require the containing element
            var fontSize = cssValue(element, "fontSize");

            // em is easy-ish
            if (unit === 'em') {
                return round(val*parseFloat(fontSize));
            }

            // ex and ch require measuring actual letters in the font
            // copy the font-size and font-style
            testStyle.fontSize = fontSize;
            testStyle.fontFamily = cssValue(element, 'fontFamily', 1);

            // find the pixels per unit
            testValue = pixelsPerUnit(unit);

            // return the conversion
            return round(val*testValue);
        }

        // conversion failed, likely a percentage was supplied
        // TODO: we could actually handle several common percentages if we knew the target prop
        return false;
    };

    // NOTE: percentages are calculated differently per property
    // TODO: it would be possible to calculate for most common properties, like height, width, top, bottom, margin, padding, etc
    Length.percentageToPx = function (value, relativeValue) {
        // overloading
        if (typeof value === "string") {
            value = Length.parseValue(value);
        }
        
        // percentages are easy with a relative value
        // TODO: it would be possibble to convert all units given the target element and the css property
        if (value.unit === '%') {
            return parseFloat(relativeValue)*value.value/100;
        }

        // conversion failed, likely a non-percentage unit was supplied
        return false;
    };
})(this, this.document, this.document.body);

