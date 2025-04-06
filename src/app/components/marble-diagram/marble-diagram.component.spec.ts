import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { MarbleDiagramComponent } from './marble-diagram.component';
import { signal } from '@angular/core';
import { MarbleEventTypeEnum } from './models/marble-event-type.enum';

describe('MarbleDiagramComponent', () => {
	let component: MarbleDiagramComponent;
	let fixture: ComponentFixture<MarbleDiagramComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MarbleDiagramComponent]
		}).compileComponents();

		fixture = TestBed.createComponent(MarbleDiagramComponent);

		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('drawDiagram', () => {
		const testCases: { input: string; expected: MarbleEventTypeEnum[] | string[] }[] = [
			{
				input: 'a------b',
				expected: ['event', 'space', 'space', 'space', 'space', 'space', 'space', 'event', 'space-fake']
			},
			{
				input: 'ab',
				expected: ['event', 'space-fake', 'event', 'space-fake']
			},
			{
				input: 'ab#',
				expected: ['event', 'space-fake', 'event', 'error', 'space-fake']
			},
			{
				input: 'ab|',
				expected: ['event', 'space-fake', 'event-and-complete', 'space-fake']
			},
			{
				input: '(ab)|',
				expected: ['space', 'group', 'space', 'complete', 'space-fake']
			},
			{
				input: 'a(b-c)',
				expected: ['event', 'space', 'event', 'space', 'event', 'space', 'space-fake']
			},
			{
				input: '(a 3ms b)',
				expected: ['space', 'event', 'space', 'space', 'space', 'event', 'space', 'space-fake']
			},
			{
				input: '(k 3ms l|)',
				expected: ['space', 'event', 'space', 'space', 'space', 'event-and-complete', 'space-fake']
			},
			{
				input: '(g 1ms h-|)',
				expected: ['space', 'event', 'space', 'event', 'space', 'complete', 'space-fake']
			},
			{
				input: '-- 1ms a 1ms (c|)',
				expected: ['space', 'space', 'space', 'event', 'space', 'space', 'group', 'complete', 'space-fake']
			},
			{
				input: '2ms (a-b|)',
				expected: ['space', 'space', 'space', 'event', 'space', 'event-and-complete', 'space-fake']
			},
			{
				input: '2ms (0-1|)',
				expected: ['space', 'space', 'space', 'event', 'space', 'event-and-complete', 'space-fake']
			},
			{
				input: '2ms (0-1#)',
				expected: ['space', 'space', 'space', 'event', 'space', 'event', 'error', 'space-fake']
			},
			{
				input: '(g 3ms h)',
				expected: ['space', 'event', 'space', 'space', 'space', 'event', 'space', 'space-fake']
			},
			{
				input: '(g 1000ms h)(i 1s j)(k 2s l)-|',
				expected: [
					'space',
					'event',
					'space',
					'event',
					'space',
					'space',
					'event',
					'space',
					'event',
					'space',
					'space',
					'event',
					'space',
					'event',
					'space',
					'space',
					'complete',
					'space-fake'
				]
			}
		];

		testCases.forEach(({ input, expected }) => {
			it(`should draw diagram with input ${input}`, () => {
				component.marbleInput = signal(input);

				component.drawDiagram(component.marbleInput);

				const events = component.events();
				const eventTypes = events.map((event) => event.type);

				// const event = events.map((it) => {
				// 	console.log(`it: `, it);
				// 	return it.type;
				// });

				expect(eventTypes).toEqual(expected);
			});
		});
	});

	it('should render element input a------b', fakeAsync(() => {
		const input = 'a------b';
		const inputLetters = input.replace(/[^a-zA-Z]/g, '').split('');
		const expected = ['event', 'space', 'space', 'space', 'space', 'space', 'space', 'event', 'space-fake'];
		component.marbleInput = signal(input);

		component.drawDiagram(component.marbleInput);
		fixture.detectChanges();
		tick();

		const events = component.events();
		const eventTypes = events.map((event) => event.type);
		expect(eventTypes).toEqual(expected);

		const compiled = fixture.nativeElement as HTMLElement;
		const letters = Array.from(compiled.querySelectorAll('.event')).map((el) => {
			return el.textContent?.trim();
		});

		// console.log(`letters: `, letters);
		// console.log(`inputLetters: `, inputLetters);

		expect(letters).toEqual(inputLetters);
	}));
});
