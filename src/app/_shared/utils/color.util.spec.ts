import { ColorUtil } from './color.util';

describe('ColorUtil', () => {
	it('should convert hexadecimal to HSL correctly', () => {
		const hex = '#ff0000';
		const expected = 'hsl(0, 100%, 50%)';
		expect((ColorUtil as any).hexadecimalToHsl(hex)).toBe(expected);
	});

	it('should handle lightness percentage correctly', () => {
		const hex = '#00ff00';
		const lightnessPercentage = 10;
		const expected = 'hsl(120, 100%, 60%)';
		expect((ColorUtil as any).hexadecimalToHsl(hex, lightnessPercentage)).toBe(expected);
	});

	it('should return HSL with 0% saturation for grayscale colors', () => {
		const hex = '#808080';
		const expected = 'hsl(0, 0%, 50%)';
		expect((ColorUtil as any).hexadecimalToHsl(hex)).toBe(expected);
	});

	it('should handle black color correctly', () => {
		const hex = '#000000';
		const expected = 'hsl(0, 0%, 0%)';
		expect((ColorUtil as any).hexadecimalToHsl(hex)).toBe(expected);
	});

	it('should handle white color correctly', () => {
		const hex = '#ffffff';
		const expected = 'hsl(0, 0%, 100%)';
		expect((ColorUtil as any).hexadecimalToHsl(hex)).toBe(expected);
	});

	it('should darken the HSL color correctly', () => {
		const hex = '#ff0000';
		const darken = 20;
		const expected = 'hsl(0, 100%, 30%)';
		expect(ColorUtil.hexadecimalToHslDarken(hex, darken)).toBe(expected);
	});

	it('deve ajustar o hue para ser positivo se for menor que 0', () => {
		const hex = '#0000ff';
		const expected = 'hsl(240, 100%, 50%)';
		expect((ColorUtil as any).hexadecimalToHsl(hex)).toBe(expected);
	});

	it('deve entrar no if(hue < 0) e corrigir adicionando 360', () => {
		const result = ColorUtil.hexadecimalToHslDarken('#FF0033', 0);
		expect(result).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
	});
});
