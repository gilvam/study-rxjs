import { TimesModel } from './times.model';

describe('TimesModel', () => {
	it('should create a time model with default value and unit', () => {
		const time = new TimesModel();

		expect(time.value).toBe(0);
		expect(time.unit).toBe('');
	});

	it('should create a time model with specified value and unit', () => {
		const time = new TimesModel(5, 's');

		expect(time.value).toBe(5);
		expect(time.unit).toBe('s');
	});

	it('should allow updating the value', () => {
		const value = 10;
		const time = new TimesModel();
		time.value = value;

		expect(time.value).toBe(value);
	});

	it('should allow updating the unit', () => {
		const unit = 'm';

		const time = new TimesModel();
		time.unit = unit;

		expect(time.unit).toBe(unit);
	});

	it('should handle negative values', () => {
		const time = new TimesModel(-5, 's');

		expect(time.value).toBe(-5);
		expect(time.unit).toBe('s');
	});

	it('should handle empty units', () => {
		const time = new TimesModel(10, '');

		expect(time.value).toBe(10);
		expect(time.unit).toBe('');
	});
});
