export class ColorUtil {
	private static hexadecimalToHsl(
		hexadecimal: string,
		lightnessPercentage = 0,
	): string {
		const hex = hexadecimal.replace(/^#/, '');
		const r = parseInt(hex.substring(0, 2), 16) / 255;
		const g = parseInt(hex.substring(2, 4), 16) / 255;
		const b = parseInt(hex.substring(4, 6), 16) / 255;

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const diff = max - min;

		const lightness = (max + min) / 2;
		const saturation =
			lightness === 0 ? 0 : diff / (1 - Math.abs(2 * lightness - 1));

		let hue;
		if (diff === 0) {
			hue = 0;
		} else {
			if (max === r) {
				hue = (g - b) / diff;
			} else if (max === g) {
				hue = 2 + (b - r) / diff;
			} else {
				hue = 4 + (r - g) / diff;
			}
			hue *= 60;
			if (hue < 0) {
				hue += 360;
			}
		}

		const h = Math.round(hue);
		const s = Math.round(saturation * 100);
		const l = Math.round(lightness * 100 + lightnessPercentage);

		return `hsl(${h}, ${s}%, ${l}%)`;
	}

	static hexadecimalToHslDarken(hexadecimal: string, darken: number): string {
		return ColorUtil.hexadecimalToHsl(hexadecimal, -darken);
	}
}
