import { TimerUtil } from './timer.util';
import { TimesModel } from './models/times.model';
import { TimeEnum } from './models/time.enum';

describe('TimerUtil', () => {
	it('should normalize mixed time units to the smallest unit with the least digits', () => {
		const input = '(a 100ms b)-c-(d 30s e)-f-(g 1m h)';
		const expected = '(a 100ms b)-c-(d 30000ms e)-f-(g 60000ms h)';
		expect(TimerUtil.normalizeTimeUnits(input)).toBe(expected);
	});

	it('should handle input with only milliseconds', () => {
		const input = '(a 100ms b)-c-(d 200ms e)-f-(g 300ms h)';
		const expected = '(a 100ms b)-c-(d 200ms e)-f-(g 300ms h)';
		expect(TimerUtil.normalizeTimeUnits(input)).toBe(expected);
	});

	it('should handle input with only seconds', () => {
		const input = '(a 1s b)-c-(d 2s e)-f-(g 3s h)';
		const expected = '(a 1s b)-c-(d 2s e)-f-(g 3s h)';
		expect(TimerUtil.normalizeTimeUnits(input)).toBe(expected);
	});

	it('should handle input with only minutes', () => {
		const input = '(a 1m b)-c-(d 2m e)-f-(g 3m h)';
		const expected = '(a 1m b)-c-(d 2m e)-f-(g 3m h)';
		expect(TimerUtil.normalizeTimeUnits(input)).toBe(expected);
	});

	it('should handle input with only one time', () => {
		const input = '(a 10ms b)';
		const expected = '(a 10ms b)';
		expect(TimerUtil.normalizeTimeUnits(input)).toBe(expected);
	});

	it('should handle input with two times', () => {
		const input = '(a 1000ms b)(c 5s d)';
		const expected = '(a 1s b)(c 5s d)';
		expect(TimerUtil.normalizeTimeUnits(input)).toBe(expected);
	});

	it('should return the input unchanged if no time units are found', () => {
		const input = '(a b)-c-(d e)-f-(g h)';
		expect(TimerUtil.normalizeTimeUnits(input)).toBe(input);
	});

	it('should return the input unchanged if an unknown time unit is found', () => {
		const input = 'x';
		expect(TimerUtil.normalizeTimeUnits(input)).toBe(input);
	});

	it('should return the original value if the time unit is unknown', () => {
		const input = new TimesModel(100, 'unknown' as TimeEnum);
		const result = TimerUtil['toMs'](input);
		expect(result).toBe(100);
	});
});
