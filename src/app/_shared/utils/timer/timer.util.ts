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

	static normalizeTimeUnits(inputs: string[] | string): string[] {
		const timeRegex = /(\d+)(ms|s|m)/g;
		const inputArray = Array.isArray(inputs) ? inputs : [inputs];

		const allTimes: TimesModel[] = inputArray.flatMap((input) => {
			const matches = Array.from(input.matchAll(timeRegex));
			return matches.map((match) => new TimesModel(Number(match.at(1)), match.at(2)));
		});

		const unitConverters: Record<string, (ms: number) => number> = {
			ms: (ms: number) => ms,
			s: (ms: number) => Math.floor(ms / 1000),
			m: (ms: number) => Math.floor(ms / 60000)
		};

		const validUnits = [TimeEnum.MS, TimeEnum.S, TimeEnum.M].filter((timer) => {
			return allTimes.every((time) => {
				const ms = TimerUtil.toMs(time);
				return unitConverters[timer](ms) > 0;
			});
		});

		if (allTimes.length === 0 || validUnits.length === 0) {
			return inputArray;
		}

		const unitScores = validUnits.map((unit) => {
			const totalDigits = allTimes.reduce((sum, time) => {
				const ms = TimerUtil.toMs(time);
				const converted = unitConverters[unit](ms);
				return sum + String(converted).length;
			}, 0);
			return { unit, totalDigits };
		});

		const bestUnit = unitScores.sort((a, b) => a.totalDigits - b.totalDigits)[0].unit;

		return inputArray.map((input) => {
			let timeIndex = 0;
			const matches = Array.from(input.matchAll(timeRegex));
			const convertedValues = matches.map((match) => {
				const time = new TimesModel(Number(match.at(1)), match.at(2));
				return unitConverters[bestUnit](TimerUtil.toMs(time));
			});

			return input.replace(timeRegex, () => {
				const original = convertedValues[timeIndex++];
				return `${original}${bestUnit}`;
			});
		});
	}
}
