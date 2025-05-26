import { EnumUtil } from './enum.util';

describe('EnumUtil', () => {
	describe('isEqual', () => {
		it('returns true when value matches enumValue as strings', () => {
			expect(EnumUtil.isEqual('TEST', 'TEST')).toBe(true);
		});

		it('returns false when value does not match enumValue', () => {
			expect(EnumUtil.isEqual('TEST', 'DIFFERENT')).toBe(false);
		});

		it('returns true when value and enumValue are both null', () => {
			expect(EnumUtil.isEqual(null, null)).toBe(true);
		});

		it('returns true when value and enumValue are both undefined', () => {
			expect(EnumUtil.isEqual(undefined, undefined)).toBe(true);
		});

		it('returns false when value is null and enumValue is a string', () => {
			expect(EnumUtil.isEqual(null, 'TEST')).toBe(false);
		});

		it('returns false when value is undefined and enumValue is a string', () => {
			expect(EnumUtil.isEqual(undefined, 'TEST')).toBe(false);
		});

		it('returns true when value is a number as a string and enumValue is the same number', () => {
			expect(EnumUtil.isEqual('123', 123)).toBe(true);
		});

		it('returns false when value is a string and enumValue is a different number', () => {
			expect(EnumUtil.isEqual('123', 456)).toBe(false);
		});
	});
});
