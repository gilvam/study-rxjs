import { AfterViewInit, Component, Inject, PLATFORM_ID, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule } from '@angular/forms';
import { isPlatformBrowser, NgClass } from '@angular/common';
import { MarbleEvent } from './models/marble-event.model';
import { MarbleEventTypeEnum } from './models/marble-event-type.enum';
import { ColorService } from './services/color.service';
import { MarbleDiagramTypeEnum } from './models/marble-diagram-type.enum';
import { TimerUtil } from '../../_shared/utils/timer/timer.util';

@Component({
	selector: 'app-marble-diagram',
	imports: [FormsModule, NgClass],
	templateUrl: './marble-diagram.component.html',
	styleUrl: './marble-diagram.component.scss'
})
export class MarbleDiagramComponent implements AfterViewInit {
	private defaultTime = 'ms';
	events = signal<MarbleEvent[]>([]);
	timeType = signal(this.defaultTime);

	marbleInput = signal('12-3(abc)(d-e)(fg 1000ms hi)(j 5s k)|');
	isTimerEnabled = signal(true);

	form = new FormGroup({
		marbleInput: new FormControl('12-3(abc)(d-e)(fg 1000ms hi)(j 5s k)|'),
		isTimerEnabled: new FormControl(true)
	});

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		public colorService: ColorService,
		private builder: FormBuilder
	) {}

	ngAfterViewInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.buildForm();
			this.drawDiagram(this.marbleInput);
		}
	}

	buildForm(): void {
		this.builder.group({
			marbleInput: ['12-3(abc)(d-e)(fg 1000ms hi)(j 5s k)|'],
			isTimerEnabled: [true]
		});
	}

	getEventClass(type: MarbleEventTypeEnum): Record<string, boolean> {
		return {
			'item--space': type === MarbleEventTypeEnum.SPACE,
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

	drawDiagram(diagramList: WritableSignal<string>): void {
		this.colorService.resetIndex();
		const tokenNormalizedUnits = TimerUtil.normalizeTimeUnits(diagramList());

		const tokens = this.tokenizeDiagram(tokenNormalizedUnits);
		const events = this.createEventsFromTokens(tokens);
		this.events.set(events);

		this.timeType.set(tokenNormalizedUnits.match(/(ms|s|m)/)?.at(0) || this.defaultTime);
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

	private handleSpaceEvent(acc: MarbleEvent[]): MarbleEvent[] {
		acc.push(...this.getSpaceEvent());
		return acc;
	}

	private replaceGroupToFrame(token: string): string {
		return token.replace('(', '-').replace(')', '-');
	}

	private handleSpecialGroupEvent(token: string, acc: MarbleEvent[]): MarbleEvent[] {
		const tokenListTimeToFrame = token.replace(/(\d+)(ms|s|m)/g, (_, value: number) => '-'.repeat(Number(value)));
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
		const msValue = Number(token.replace(/ms|s|m/, '')) || 1;
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
