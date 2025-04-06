export class TimerUtil {
	static normalizeTimeUnits(input: string): string {
		const timeRegex = /(\d+)(ms|s|m)/g;

		const times: { value: number; unit: string }[] = [];

		let match;
		while ((match = timeRegex.exec(input)) !== null) {
			times.push({ value: parseInt(match[1]), unit: match[2] });
		}

		if (times.length === 0) return input;

		const toMs = (value: number, unit: string): number => {
			if (unit === 'ms') return value;
			if (unit === 's') return value * 1000;
			if (unit === 'm') return value * 60000;
			return value;
		};

		const unitConverters: Record<string, (ms: number) => number> = {
			ms: (ms: number) => ms,
			s: (ms: number) => Math.floor(ms / 1000),
			m: (ms: number) => Math.floor(ms / 60000)
		};

		const validUnits = ['ms', 's', 'm'].filter((unit) => {
			return times.every(({ value, unit: fromUnit }) => {
				const ms = toMs(value, fromUnit);
				return unitConverters[unit](ms) > 0;
			});
		});

		if (!validUnits.length) {
			return input;
		}

		const unitScores = validUnits.map((unit) => {
			const totalDigits = times.reduce((sum, { value, unit: fromUnit }) => {
				const ms = toMs(value, fromUnit);
				const converted = unitConverters[unit](ms);
				return sum + String(converted).length;
			}, 0);
			return { unit, totalDigits };
		});

		const bestUnit = unitScores.sort((a, b) => a.totalDigits - b.totalDigits)[0].unit;

		const convertedValues = times.map(({ value, unit }) => {
			const ms = toMs(value, unit);
			return unitConverters[bestUnit](ms);
		});

		const minValue = Math.min(...convertedValues);

		let timeIndex = 0;
		const result = input.replace(timeRegex, (_match, val, unit) => {
			const original = convertedValues[timeIndex++];
			const normalized = Math.round(original / minValue);
			return `${normalized}${bestUnit}`;
		});

		return result;
	}
}
