import { ColorUtil } from "../../../_shared/utils/color.util";

export class Color {
	private index = 0;
	colors = [
		"#3ea1cb",
		"#ffcb46",
		"#77dd77",
		"#ff9c9c",
		"#6CB0A8",
		"#d3bcf6",
		"#ff7f00",
		"#ffb1ee",
		"#d3dd33",
		"#ff6961",
		"#C1C2AD",
		"#FFD898",
		"#f9f7f7",
		"#b5dccd",
		"#b1becd",
		"#c6b9c0",
		"#a9b8b2",
		"#64a49e"
	];

	constructor(colors: string[] = []) {
		this.colors = colors.length ? colors : this.colors;
	}

	get backGround(): string {
		return this.colors[this.index++ % this.colors.length];
	}

	backGroundRadialDarken(color: string): string {
		const darken = ColorUtil.hexadecimalToHslDarken(color, 14);
		const lighten = `rgb(from ${color} r g b / 1)`;
		return `radial-gradient(circle, ${lighten} 0%, ${darken} 100%)`;
	}
}
