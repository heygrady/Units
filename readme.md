# Units
Units is a JavaScript library for converting between angle and length units. Both are intended for use within other libraries that need to convert between acceptable CSS units when creating polyfills. Using these unit conversions allows a library to support all valid CSS units easily.

## Angle
Used for converting between various angle units. Angle calculations are simple math and the library is less than 500 characters when minified. There's a detailed description of [CSS angle units on the MDN](https://developer.mozilla.org/en/CSS/angle).

```javascript
// Degrees
Angle.toDeg('360deg'); //-> 360
Angle.toDeg((2 * Math.PI) +'rad'); //-> 360
Angle.toDeg('4grad'); //-> 360
Angle.toDeg('1turn'); //-> 360

// Radians
Angle.toRad('360deg'); //-> 6.283185307179586 (2 * PI)
Angle.toRad((2 * Math.PI) +'rad'); //-> 6.283185307179586 (2 * PI)
Angle.toRad('4grad'); //-> 6.283185307179586 (2 * PI)
Angle.toRad('1turn'); //-> 6.283185307179586 (2 * PI)

// Gradians
Angle.toGrad('360deg'); //-> 4
Angle.toGrad((2 * Math.PI) +'rad'); //-> 4
Angle.toGrad('4grad'); //-> 4
Angle.toGrad('1turn'); //-> 4

// Turns
Angle.toTurn('360deg'); //-> 1
Angle.toTurn((2 * Math.PI) +'rad');  //-> 1
Angle.toTurn('4grad'); //-> 1
Angle.toTurn('1turn'); //-> 1
```

## Length
Used for converting between various length units. Absolute units -- such as inches, points and centimeters -- are relative to the Screen DPI which is usually 96. Not all units are supported in every browser, in those cases 0 is returned. In all cases this library uses the browsers own CSS calculations (by setting values with the style property). There's a detailed description of [CSS length units on the MDN](https://developer.mozilla.org/en/CSS/length). The length library is around 1200 characters when minified.

```javascript
// Absolute Units
// Different based on the Screen DPI
Length.toPx('10px'); //-> Always: 10px
Length.toPx('10mm'); //-> Always: 38px
Length.toPx('1cm'); //-> Always: 38px
Length.toPx('1in'); //-> Always: 96px
Length.toPx('12pt'); //-> Always: 16px
Length.toPx('1pc'); //-> Always: 16px
Length.toPx('10mozmm'); //-> Usually: 0px; Firefox: 38px

// Viewport-relative Units
// Different based on the browser windows size
Length.toPx('2vh'); //-> Usually: 0px; IE9: 5px
Length.toPx('2vw'); //-> Usually: 0px; IE9: 23px
Length.toPx('2vm'); //-> Usually: 0px; IE9: 5px

// Font-relative Units
// Different based on the font on the element (Below is default font of 16px serif font)
// em, ex, ch require an element for reference.
Length.toPx('1em', element); //-> Usually: 16px
Length.toPx('1ex', element); //-> Usually: 7px; IE7, Safari: 8px;
Length.toPx('1ch', element); //-> Usually: 0px; Firefox: 8px; IE9: 7px
Length.toPx('1rem'); //-> Usually: 16px; IE8, IE7: 0px;
```

Percentage lengths cannot be easily determined because the percentage is relative to a different measurement based on the CSS property it is applied to. It is usually based on the height or width of the parent element (padding, margin, top, bottom, etc.). It would be unreasonable to maintain a mapping of all possible CSS properties the can have percentage lenghts and their mesaurments relative to the element.

```javascript
// Percentages
// a silly function for calculating the padding left on an element
function calculatePaddingLeft(element, value) {
    // It's usually best to check for percentage units
    var val = Length.parseValue(value),
        pixels, width;
    if (val.unit === '%') {
        // in this case we're converting percentage padding, which is based on the parent width
        // we'll cheat and use jQuery to look up the parent width
        width = $(element).parent().css('width');

        // val is the parsed value object.
        // the first argument can be either a string or a parsed value
        pixels = Length.percentageToPx(val, width);
    } else {
        // fall back to converting to pixels using normal units
        pixels = Length.toPx(val, element);
    }
}

calculatePaddingLeft(element, '10%');
calculatePaddingLeft(element, '10em');
```
    