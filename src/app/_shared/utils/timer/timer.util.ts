import { TimesModel } from './models/times.model';
import { TimeEnum } from './models/time.enum';

export class TimerUtil {
	private static toMs(time: TimesModel): number {
		const conversionFactors: Record<TimeEnum | string, number> = {
			[TimeEnum.MS]: 1,
			[TimeEnum.S]: 1000,
			[TimeEnum.M]: 60000
		};

		return time.value * (conversionFactors[time.unit] || 1);
	}

	static normalizeTimeUnits(input: string): string {
		const timeRegex = /(\d+)(ms|s|m)/g;
		const matches = Array.from(input.matchAll(timeRegex));
		const times: TimesModel[] = matches.map((match) => new TimesModel(Number(match.at(1)), match.at(2)));
		const unitConverters: Record<string, (ms: number) => number> = {
			ms: (ms: number) => ms,
			s: (ms: number) => Math.floor(ms / 1000),
			m: (ms: number) => Math.floor(ms / 60000)
		};

		const validUnits = [TimeEnum.MS, TimeEnum.S, TimeEnum.M].filter((timer) => {
			return times.every((time) => {
				const ms = TimerUtil.toMs(time);
				return unitConverters[timer](ms) > 0;
			});
		});

		if (times.length === 1) {
			return input;
		}

		const unitScores = validUnits.map((unit) => {
			const totalDigits = times.reduce((sum, time) => {
				const ms = TimerUtil.toMs(time);
				const converted = unitConverters[unit](ms);
				return sum + String(converted).length;
			}, 0);
			return { unit, totalDigits };
		});

		const bestUnit = unitScores.sort((a, b) => a.totalDigits - b.totalDigits)[0].unit;
		const convertedValues = times.map((time) => unitConverters[bestUnit](TimerUtil.toMs(time)));
		// const minValue = Math.min(...convertedValues);

		let timeIndex = 0;
		const result = input.replace(timeRegex, () => {
			const original = convertedValues[timeIndex++];
			// const normalized = minValue > 0 ? Math.round(original / minValue) : original;
			return `${original}${bestUnit}`;
		});

		return result;
	}
}
