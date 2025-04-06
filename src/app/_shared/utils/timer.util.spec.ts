// (a 100ms b)-c-(d 30s e)-f-(g 1m h)

import { TimerUtil } from './timer.util';

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

	it('should return the input unchanged if no time units are found', () => {
		const input = '(a b)-c-(d e)-f-(g h)';
		expect(TimerUtil.normalizeTimeUnits(input)).toBe(input);
	});
});
