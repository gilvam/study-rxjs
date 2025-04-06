import { TestBed } from '@angular/core/testing';

import { ColorService } from './color.service';

describe('ColorService', () => {
	let service: ColorService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(ColorService);
	});

	it('deve definir as cores corretamente', () => {
		const newColors = ['#123456', '#654321'];
		service.setColors(newColors);
		expect(service.colors).toEqual(newColors);
	});

	it('deve retornar a cor de fundo correta', () => {
		service.setColors(['#123456', '#654321']);
		expect(service.backGround).toBe('#123456');
		expect(service.backGround).toBe('#654321');
		expect(service.backGround).toBe('#123456');
	});

	it('deve retornar o gradiente radial escurecido corretamente', () => {
		const color = '#ff0000';
		const expected = 'radial-gradient(circle, rgb(from #ff0000 r g b / 1) 0%, hsl(0, 100%, 36%) 100%)';
		expect(service.backGroundRadialDarken(color)).toBe(expected);
	});
});
