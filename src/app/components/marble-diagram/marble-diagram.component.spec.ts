import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarbleDiagramComponent } from './marble-diagram.component';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MarbleEventTypeEnum } from './models/marble-event-type.enum';

describe('MarbleDiagramComponent', () => {
	let component: MarbleDiagramComponent;
	let fixture: ComponentFixture<MarbleDiagramComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MarbleDiagramComponent],
			providers: [FormsModule, ReactiveFormsModule]
		}).compileComponents();

		fixture = TestBed.createComponent(MarbleDiagramComponent);

		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('drawDiagram', () => {
		const testCases: { inputs: string[]; expected: string[][]; expectedGroups?: string[][][] }[] = [
			{
				inputs: ['a------b'],
				expected: [['event', 'space', 'space', 'space', 'space', 'space', 'space', 'event']]
			},
			{
				inputs: ['ab'],
				expected: [['event', 'event']]
			},
			{
				inputs: ['ab#'],
				expected: [['event', 'event', 'error']]
			},
			{
				inputs: ['ab|'],
				expected: [['event', 'event-and-complete']]
			},
			{
				inputs: ['(ab)|'],
				expected: [['space', 'group', 'space', 'complete']],
				expectedGroups: [[[], ['event', 'event'], [], []]]
			},
			{
				inputs: ['(ab|)'],
				expected: [['space', 'group', 'complete']],
				expectedGroups: [[[], ['event', 'event'], []]]
			},
			{
				inputs: ['(ab#)'],
				expected: [['space', 'group', 'error']],
				expectedGroups: [[[], ['event', 'event'], []]]
			},
			{
				inputs: ['a(b-c)'],
				expected: [['event', 'space', 'event', 'space', 'event', 'space']]
			},
			{
				inputs: ['(a-b|)'],
				expected: [['space', 'event', 'space', 'event-and-complete']]
			},
			{
				inputs: ['(a-b#)'],
				expected: [['space', 'event', 'space', 'event', 'error']]
			},
			{
				inputs: ['(a 3ms b)'],
				expected: [['space', 'event', 'space', 'space', 'space', 'event', 'space']]
			},
			{
				inputs: ['(k 3ms l|)'],
				expected: [['space', 'event', 'space', 'space', 'space', 'event-and-complete']]
			},
			{
				inputs: ['(k 3ms l#)'],
				expected: [['space', 'event', 'space', 'space', 'space', 'event', 'error']]
			},
			{
				inputs: ['(g 1ms h-|)'],
				expected: [['space', 'event', 'space', 'event', 'space', 'complete']]
			},
			{
				inputs: ['-- 1ms a 1ms (c|)'],
				expected: [['space', 'space', 'space', 'event', 'space', 'space', 'group', 'complete']],
				expectedGroups: [[[], [], [], [], [], [], ['event'], []]]
			},
			{
				inputs: ['2ms (a-b|)'],
				expected: [['space', 'space', 'space', 'event', 'space', 'event-and-complete']]
			},
			{
				inputs: ['2ms (0-1|)'],
				expected: [['space', 'space', 'space', 'event', 'space', 'event-and-complete']]
			},
			{
				inputs: ['2ms (0-1#)'],
				expected: [['space', 'space', 'space', 'event', 'space', 'event', 'error']]
			},
			{
				inputs: ['(g 3ms h)'],
				expected: [['space', 'event', 'space', 'space', 'space', 'event', 'space']]
			},
			{
				inputs: ['(a-b)', '12'],
				expected: [
					['space', 'event', 'space', 'event', 'space'],
					['event', 'event', 'space-fake', 'space-fake', 'space-fake']
				]
			},
			{
				inputs: ['(g 1000ms h)(i 1s j)(k 2s l)-|'],
				expected: [
					[
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
				]
			}
		];

		testCases.forEach((testCase) => {
			it(`should draw diagram with input ${testCase.inputs}`, () => {
				component.form.controls.marbleInputList.clear();
				testCase.inputs.forEach((it) => component.form.controls.marbleInputList.push(new FormControl(it)));

				component.drawDiagram();

				const events = component.eventMatrix();
				const eventTypes = events.map((list) => list.map((event) => event.type));
				const eventGroups = events
					.map((list) => list.map((it) => it.subEvents?.map((subEvent) => subEvent.type)))
					.filter(Boolean);

				if (eventTypes.flat().includes(MarbleEventTypeEnum.GROUP)) {
					expect(eventGroups).toEqual(testCase.expectedGroups);
				}
				expect(eventTypes).toEqual(testCase.expected);
			});
		});
	});

	it('should render element input a------b', () => {
		const input = 'a------b';
		const inputLetters = input.replace(/[^a-zA-Z]/g, '').split('');
		const eventExpected = ['event', 'space', 'space', 'space', 'space', 'space', 'space', 'event'];
		component.form.controls.marbleInputList.setValue([input]);

		component.drawDiagram();
		fixture.detectChanges();
		const events = component.eventMatrix().at(0) || [];
		const eventTypes = events.map((event) => event.type);
		const compiled = fixture.nativeElement as HTMLElement;
		const letters = Array.from(compiled.querySelectorAll('.item'))
			.map((el) => el.textContent?.trim())
			.filter(Boolean);

		expect(eventTypes).toEqual(eventExpected);
		expect(letters).toEqual(inputLetters);
	});
});
