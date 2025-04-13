import { AfterViewInit, Component, Inject, PLATFORM_ID, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { isPlatformBrowser, NgClass } from '@angular/common';
import { MarbleEvent } from './models/marble-event.model';
import { MarbleEventTypeEnum } from './models/marble-event-type.enum';
import { ColorService } from './services/color.service';
import { MarbleDiagramTypeEnum } from './models/marble-diagram-type.enum';
import { TimerUtil } from '../../_shared/utils/timer/timer.util';

@Component({
	selector: 'app-marble-diagram',
	imports: [FormsModule, NgClass, ReactiveFormsModule],
	templateUrl: './marble-diagram.component.html',
	styleUrl: './marble-diagram.component.scss'
})
export class MarbleDiagramComponent implements AfterViewInit {
	private marbleList = ['ab(cd)(e-f)(g 1000ms h)(i 3s j|)'];
	private defaultTime = 'ms';
	private maxRepeat = 100;
	eventMatrix = signal<MarbleEvent[][]>([]);
	timeType = signal(this.defaultTime);

	form = new FormGroup({
		marbleInputList: new FormArray(this.marbleList.map((it) => new FormControl<string>(it))),
		isTimerEnabled: new FormControl(true)
	});

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		public colorService: ColorService
	) {}

	ngAfterViewInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.drawDiagram();
		}
	}

	btnDiagramNew(): void {
		this.form.controls.marbleInputList.push(new FormControl<string>(''));
	}

	btnDiagramRemove(index: number): void {
		console.log(`index: `, index);

		this.form.controls.marbleInputList.removeAt(index);

		this.eventMatrix.set(this.eventMatrix().filter((_, i) => i !== index));

		// this.eventMatrix().splice(index, 1);
		// this.eventMatrix.set([...this.eventMatrix()]);
	}

	getEventClass(type: MarbleEventTypeEnum): Record<string, boolean> {
		return {
			'item--space': type === MarbleEventTypeEnum.SPACE || type === MarbleEventTypeEnum.SPACE_FAKE,
			'item--group': type === MarbleEventTypeEnum.GROUP,
			'item--event': type === MarbleEventTypeEnum.EVENT || type === MarbleEventTypeEnum.EVENT_AND_COMPLETE,
			'item--complete': type === MarbleEventTypeEnum.COMPLETE,
			'item--complete-event': type === MarbleEventTypeEnum.EVENT_AND_COMPLETE,
			'item--error': type === MarbleEventTypeEnum.ERROR
		};
	}

	isEvent(type: MarbleEventTypeEnum): boolean {
		return type === MarbleEventTypeEnum.EVENT || type === MarbleEventTypeEnum.EVENT_AND_COMPLETE;
	}

	isEventGroup(type: MarbleEventTypeEnum): boolean {
		return type === MarbleEventTypeEnum.GROUP;
	}

	drawDiagram(): void {
		this.colorService.resetIndex();

		const tokenNormalizedUnitList = TimerUtil.normalizeTimeUnits(
			this.form.getRawValue().marbleInputList.filter((item) => item !== null)
		);
		this.form.controls.marbleInputList.controls.forEach((control, index) => {
			const tokenNormalizedUnits = tokenNormalizedUnitList[index];
			const tokens = this.tokenizeDiagram(tokenNormalizedUnits);
			const events = this.createEventsFromTokens(tokens);

			this.eventMatrix.set(Object.assign([...this.eventMatrix()], { [index]: events }));

			const e = this.getNormalizedEventMatrix(this.eventMatrix());
			this.eventMatrix.set(e);

			this.timeType.set(
				tokenNormalizedUnitList
					.join('')
					.match(/(ms|s|m)\s/)
					?.at(0) || this.defaultTime
			);
		});
	}

	private filterDiagramList(
		diagramList: string[],
		chars: string[] = [MarbleDiagramTypeEnum.ERROR, MarbleDiagramTypeEnum.COMPLETE]
	): string[] {
		const indices = chars.map((char) => diagramList.indexOf(char)).filter((index) => index !== -1);
		const minIndex = Math.min(...indices);
		return minIndex !== -1 && diagramList[minIndex + 1] !== ')'
			? diagramList.slice(0, minIndex + 1)
			: diagramList.slice(0, minIndex + 2);
	}

	private tokenizeDiagram(token: string): RegExpExecArray[] {
		const filteredList = this.filterDiagramList(token.split(''));
		const diagram = filteredList.join('');
		const marbleDiagramRegex = /(\d+(ms|s|m))|(\(.*?\))|([a-z0-9])|(-)|(\|)|(#)/gi;
		return Array.from(diagram.matchAll(marbleDiagramRegex));
	}

	private createEventsFromTokens(tokens: RegExpExecArray[], accEvents: MarbleEvent[] = []): MarbleEvent[] {
		const handler = (acc: MarbleEvent[], token = '') => {
			const hasEvent = new RegExp(MarbleDiagramTypeEnum.EVENT, 'i').test(token);
			const hasGroup = /^\(.*\)$/.test(token);
			const hasFrame = token.includes(MarbleDiagramTypeEnum.FRAME);
			const hasTime = /\d+(ms|s|m)/.test(token);
			const hasGroupSpecial = hasGroup && (hasFrame || hasTime);

			const handlers = [
				{ condition: token === MarbleDiagramTypeEnum.FRAME, handler: () => this.handleSpaceEvent(acc) },
				{ condition: token === MarbleDiagramTypeEnum.COMPLETE, handler: () => this.handleCompleteEvent(acc) },
				{ condition: token === MarbleDiagramTypeEnum.ERROR, handler: () => this.handleErrorEvent(acc) },
				{ condition: hasGroupSpecial, handler: () => this.handleSpecialGroupEvent(token, acc) },
				{ condition: hasGroup, handler: () => this.handleGroupEvent(token, acc) },
				{ condition: hasTime, handler: () => this.handleTimedSpaceEvent(token, acc) },
				{ condition: hasEvent, handler: () => this.handleCharacterEvent(token, acc, tokens) }
			];

			return handlers.find((handle) => handle.condition)?.handler() || acc;
		};

		for (const token of tokens) {
			accEvents = handler(accEvents, token.at(0));
		}

		return accEvents;
	}

	private getNormalizedEventMatrix(eventMatrix: MarbleEvent[][]): MarbleEvent[][] {
		const maxCount = Math.max(...eventMatrix.map((events) => events.length));
		const evt = eventMatrix.map((events) => [...events, ...this.getSpaceFakEvent(maxCount - events.length)]);

		return evt.every((events) => events.at(-1)?.type === MarbleEventTypeEnum.SPACE_FAKE)
			? evt.map((events) => events.slice(0, -1))
			: evt;
	}

	private handleSpaceEvent(acc: MarbleEvent[]): MarbleEvent[] {
		acc.push(...this.getSpaceEvent());
		return acc;
	}

	private replaceGroupToFrame(token: string): string {
		return token.replace('(', '-').replace(')', '-');
	}

	private handleSpecialGroupEvent(token: string, acc: MarbleEvent[]): MarbleEvent[] {
		const tokenListTimeToFrame = token.replace(/(\d+)(ms|s|m)/g, (_, value: number) =>
			'-'.repeat(Math.min(Number(value), this.maxRepeat))
		);
		const tokenListWithoutSpace = tokenListTimeToFrame.replace(/\s+/g, '');
		const tokenChanged = this.replaceGroupToFrame(tokenListWithoutSpace);
		const tokenListFiltered = this.filterDiagramList(tokenChanged.split(''));
		const tokenRegexList = tokenListFiltered.map((it) => this.generateRegExp(it));

		return this.createEventsFromTokens(tokenRegexList, acc);
	}

	private handleGroupEvent(token: string, acc: MarbleEvent[]): MarbleEvent[] {
		acc.push(...this.getGroupEvent(token));
		return acc;
	}

	private handleTimedSpaceEvent(token: string, acc: MarbleEvent[]): MarbleEvent[] {
		const msValue = Math.min(Number(token.replace(/ms|s|m/, '')), this.maxRepeat);
		acc.push(...this.getSpaceEvent(msValue));
		return acc;
	}

	private handleCharacterEvent(token: string, acc: MarbleEvent[], tokens: RegExpExecArray[]): MarbleEvent[] {
		if (tokens.at(-1)?.at(0) === '|' && tokens.at(-2)?.at(0) === token) {
			acc.push(this.getEventAndComplete(token));
			return acc;
		}

		acc.push(this.getEvent(token));
		return acc;
	}

	private handleCompleteEvent(acc: MarbleEvent[]): MarbleEvent[] {
		if (!acc.find((event) => event.type === MarbleEventTypeEnum.EVENT_AND_COMPLETE)) {
			acc.push(this.getCompleteEvent());
		}
		return acc;
	}

	private handleErrorEvent(acc: MarbleEvent[]): MarbleEvent[] {
		acc.push(this.getErrorEvent());
		return acc;
	}

	private generateRegExp(token: string): RegExpExecArray {
		return Object.assign([''], { 0: token, index: 0, input: token, groups: undefined });
	}

	private getSpaceEvent(count = 1): MarbleEvent[] {
		return Array(count).fill(new MarbleEvent('', '', MarbleEventTypeEnum.SPACE));
	}

	private getSpaceFakEvent(count = 1): MarbleEvent[] {
		return Array(count).fill(new MarbleEvent('', '', MarbleEventTypeEnum.SPACE_FAKE));
	}

	private getGroupEvent(token: string): MarbleEvent[] {
		const tokenListFiltered = this.filterDiagramList(this.replaceGroupToFrame(token.replaceAll(' ', '')).split(''));
		const subEvents = tokenListFiltered
			.filter((it) => !['|', '#', '-'].includes(it))
			.map((char) => new MarbleEvent(char, this.colorService.backGround, MarbleEventTypeEnum.EVENT));

		return [
			...(tokenListFiltered.at(0) === MarbleDiagramTypeEnum.FRAME ? this.getSpaceEvent() : []),
			new MarbleEvent('', '', MarbleEventTypeEnum.GROUP, subEvents),
			...(tokenListFiltered.some((it) => it === MarbleDiagramTypeEnum.COMPLETE) ? [this.getCompleteEvent()] : []),
			...(tokenListFiltered.some((it) => it === MarbleDiagramTypeEnum.ERROR) ? [this.getErrorEvent()] : []),
			...(tokenListFiltered.at(-1) === MarbleDiagramTypeEnum.FRAME ? this.getSpaceEvent() : [])
		];
	}

	private getEvent(token: string): MarbleEvent {
		return new MarbleEvent(token, this.colorService.backGround, MarbleEventTypeEnum.EVENT);
	}

	private getEventAndComplete(token: string): MarbleEvent {
		return new MarbleEvent(token, this.colorService.backGround, MarbleEventTypeEnum.EVENT_AND_COMPLETE);
	}

	private getCompleteEvent(): MarbleEvent {
		return new MarbleEvent('', '', MarbleEventTypeEnum.COMPLETE);
	}

	private getErrorEvent(): MarbleEvent {
		return new MarbleEvent('X', '', MarbleEventTypeEnum.ERROR);
	}
}
