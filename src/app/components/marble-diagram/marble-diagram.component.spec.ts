import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarbleDiagramComponent } from './marble-diagram.component';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

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
				inputs: ['(ab)#'],
				expected: [['group', 'error']],
				expectedGroups: [[['event', 'event'], []]]
			},
			{
				inputs: ['ab|'],
				expected: [['event', 'event', 'complete']]
			},
			{
				inputs: ['(ab)|'],
				expected: [['group', 'complete']],
				expectedGroups: [[['event', 'event'], []]]
			},
			{
				inputs: ['(ab|)'],
				expected: [['group-and-complete']],
				expectedGroups: [[['event', 'event']]]
			},
			{
				inputs: ['a(bc)'],
				expected: [['event', 'group']],
				expectedGroups: [[[], ['event', 'event']]]
			},
			{
				inputs: ['a 3ms b'],
				expected: [['event', 'space', 'space', 'space', 'event']]
			},
			{
				inputs: ['-- 1ms a 1ms (c|)'],
				expected: [['space', 'space', 'space', 'event', 'space', 'group-and-complete']],
				expectedGroups: [[[], [], [], [], [], ['event']]]
			},
			{
				inputs: ['1 2ms (ab|)'],
				expected: [['event', 'space', 'space', 'group-and-complete']],
				expectedGroups: [[[], [], [], ['event', 'event']]]
			},
			{
				inputs: ['1 2ms (01|)'],
				expected: [['event', 'space', 'space', 'group-and-complete']],
				expectedGroups: [[[], [], [], ['event', 'event']]]
			},
			{
				inputs: ['(ab)', 'cd'],
				expected: [
					['group', 'space-fake'],
					['event', 'event']
				],
				expectedGroups: [
					[['event', 'event'], []],
					[[], []]
				]
			},
			{
				inputs: ['(gh)i 1s j(kl)-|'],
				expected: [['group', 'event', 'space', 'event', 'group', 'space', 'complete']]
			}
		];

		testCases.forEach((testCase) => {
			it(`should draw diagram with input ${JSON.stringify(testCase.inputs)}`, () => {
				component.form.controls.marbleInputList.clear();
				testCase.inputs.forEach((it) => component.form.controls.marbleInputList.push(new FormControl(it)));

				component.drawDiagram();

				const events = component.eventMatrix();
				const eventTypes = events.map((list) => list.map((event) => event.type));
				const eventGroups = events.map((list) => list.map((it) => it.subEvents?.map((subEvent) => subEvent.type))).filter(Boolean);
				expect(eventGroups).toEqual(testCase.expectedGroups ?? eventGroups);
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
