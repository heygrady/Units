(function(window) {
	var Angle = window.Angle = {},
		units = ['Deg', 'Rad', 'Grad', 'Turn'],
		unitValue = [180, Math.PI, 2, 0.5],
		conversions = {},
		runits = /^([\+\-]=)?(-?[\d+.\-]+)([a-z]+|%)(.*?)$/i,
		parseValue,
		i = 4,
		j,
		unit;

	parseValue = Angle.parseValue = function (string) {
		var matches = string.match(runits);
		// TODO: matches[4] holds other values that are potentially in a list
		return {
			prefix: matches[1],
			value: matches[2],
			unit: matches[3]
		};
	};

	// create functions for each unit
	while (i--) {
		unit = units[i].toLowerCase();
		j = units.length;

		// calculate the conversions
		while (j--) {
			if (j === i) { continue; }
			conversions[unit + units[j]] = unitValue[j]/unitValue[i];
		}

		// create functions for each unit
		(function(toUnit, toUnitLower) {
			Angle['to' + toUnit] = function (value) {
				// overloading
				if (!value.unit) {
					value = parseValue(value);
				}

				var val = value.value * 1, // convert to a number
					unit = value.unit;
				
				return unit === toUnitLower ? val : val * conversions[unit + toUnit];
			};
		})(units[i], unit);
	}
})(this);