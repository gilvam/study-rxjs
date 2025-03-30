import { ColorUtil } from '../utils/color.util';

export class Color {
  private index = 0;

  constructor(
    public colors: string[],
  ) {
  }

  get backGround() : string {
    return this.colors[this.index++ % this.colors.length];
  }

  backGroundRadialDarken(color: string): string {
    const darken = ColorUtil.hexadecimalToHslDarken(color, 10);
    const lighten = `rgb(from ${color} r g b / 1)`;
    return `radial-gradient(circle, ${lighten} 0%, ${darken} 100%)`;
  }
}
