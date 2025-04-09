import { ComponentFixture, TestBed } from '@angular/core/testing';

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
		const testCases: { input: string; expected: string[]; expectedGroups?: string[][] }[] = [
			{
				input: 'a------b',
				expected: ['event', 'space', 'space', 'space', 'space', 'space', 'space', 'event']
			},
			{
				input: 'ab',
				expected: ['event', 'event']
			},
			{
				input: 'ab#',
				expected: ['event', 'event', 'error']
			},
			{
				input: 'ab|',
				expected: ['event', 'event-and-complete']
			},
			{
				input: '(ab)|',
				expected: ['space', 'group', 'space', 'complete'],
				expectedGroups: [[], ['event', 'event'], [], []]
			},
			{
				input: '(ab|)',
				expected: ['space', 'group', 'complete'],
				expectedGroups: [[], ['event', 'event'], []]
			},
			{
				input: '(ab#)',
				expected: ['space', 'group', 'error'],
				expectedGroups: [[], ['event', 'event'], []]
			},
			{
				input: 'a(b-c)',
				expected: ['event', 'space', 'event', 'space', 'event', 'space']
			},
			{
				input: '(a-b|)',
				expected: ['space', 'event', 'space', 'event-and-complete']
			},
			{
				input: '(a-b#)',
				expected: ['space', 'event', 'space', 'event', 'error']
			},
			{
				input: '(a 3ms b)',
				expected: ['space', 'event', 'space', 'space', 'space', 'event', 'space']
			},
			{
				input: '(k 3ms l|)',
				expected: ['space', 'event', 'space', 'space', 'space', 'event-and-complete']
			},
			{
				input: '(k 3ms l#)',
				expected: ['space', 'event', 'space', 'space', 'space', 'event', 'error']
			},
			{
				input: '(g 1ms h-|)',
				expected: ['space', 'event', 'space', 'event', 'space', 'complete']
			},
			{
				input: '-- 1ms a 1ms (c|)',
				expected: ['space', 'space', 'space', 'event', 'space', 'space', 'group', 'complete'],
				expectedGroups: [[], [], [], [], [], [], ['event'], []]
			},
			{
				input: '2ms (a-b|)',
				expected: ['space', 'space', 'space', 'event', 'space', 'event-and-complete']
			},
			{
				input: '2ms (0-1|)',
				expected: ['space', 'space', 'space', 'event', 'space', 'event-and-complete']
			},
			{
				input: '2ms (0-1#)',
				expected: ['space', 'space', 'space', 'event', 'space', 'event', 'error']
			},
			{
				input: '(g 3ms h)',
				expected: ['space', 'event', 'space', 'space', 'space', 'event', 'space']
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
					'space',
					'event',
					'space',
					'space',
					'complete'
				]
			}
		];

		testCases.forEach((testCase) => {
			it(`should draw diagram with input ${testCase.input}`, () => {
				component.marbleInput = signal(testCase.input);

				component.drawDiagram(component.marbleInput);

				const events = component.events();
				const eventTypes = events.map((event) => event.type);
				const eventGroups = events.map((it) => it.subEvents?.map((subEvent) => subEvent.type)).filter(Boolean);

				if (eventTypes.includes(MarbleEventTypeEnum.GROUP)) {
					expect(eventGroups).toEqual(testCase.expectedGroups);
				}
				expect(eventTypes).toEqual(testCase.expected);
			});
		});
	});

	it('should render element input a------b', () => {
		const input = 'a------b';
		const inputLetters = input.replace(/[^a-zA-Z]/g, '').split('');
		const expected = ['event', 'space', 'space', 'space', 'space', 'space', 'space', 'event'];
		component.marbleInput = signal(input);

		component.drawDiagram(component.marbleInput);
		fixture.detectChanges();
		const events = component.events();
		const eventTypes = events.map((event) => event.type);
		const compiled = fixture.nativeElement as HTMLElement;
		const letters = Array.from(compiled.querySelectorAll('.item'))
			.map((el) => el.textContent?.trim())
			.filter(Boolean);

		expect(eventTypes).toEqual(expected);
		expect(letters).toEqual(inputLetters);
	});
});
