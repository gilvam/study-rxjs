import { AfterViewInit, Component, Inject, PLATFORM_ID, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser, NgForOf, NgIf } from '@angular/common';
import { MarbleEvent } from './models/marble-event.model';
import { MarbleEventTypeEnum } from './models/marble-event-type.enum';
import { ColorService } from './services/color.service';
import { MarbleDiagramTypeEnum } from './models/marble-diagram-type.enum';
import { TimerUtil } from '../../_shared/utils/timer.util';

@Component({
	selector: 'app-marble-diagram',
	imports: [FormsModule, NgForOf, NgIf],
	templateUrl: './marble-diagram.component.html',
	styleUrl: './marble-diagram.component.scss'
})
export class MarbleDiagramComponent implements AfterViewInit {
	events = signal<MarbleEvent[]>([]);
	marbleInput = signal(
		// 'a------b'
		// '(a 10ms b)'
		// 'ab'
		// 'a---b-----c--d--e--f-g-h-i-j-(k-l)-m-(abc)|'
		// 'ab-c--d(e 10ms f)(g-h)(ij)-k|'
		// 'ab-c-(cd)-e-f-|'
		// 'ab-(cd)-(e-f)-(g 10ms h-|)'
		// '-- 9ms a 9ms b 9ms (c|)'
		// '10ms (a-b|)'
		// '10ms (0-1|)'
		// '10ms (0-1#)'

		// '(g 10ms h)'
		// 'ab-(cd)-(e-f)-(g 10ms h)(i 1s j)(k 5m l)-|'
		'(ab)(c-d)(k 10ms l|)'
	);

	// TODO: o tempo de (ms, s, m) não tem diferença nos espaçamento

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		public colorService: ColorService
	) {}

	ngAfterViewInit(): void {
		if (isPlatformBrowser(this.platformId)) {
			this.drawDiagram(this.marbleInput);
		}
	}

	drawDiagram(diagramList: WritableSignal<string>): void {
		const tokenNormalizedUnits = TimerUtil.normalizeTimeUnits(diagramList());
		const tokens = this.tokenizeDiagram(tokenNormalizedUnits);
		const events = this.createEventsFromTokens(tokens);
		events.push(...this.getSpaceFakeEvent(1));
		this.events.set(events);
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
		return tokens.reduce<MarbleEvent[]>((acc: MarbleEvent[], match: RegExpExecArray) => {
			const [token] = match;
			const hasEvent = new RegExp(MarbleDiagramTypeEnum.EVENT, 'i').test(token);
			const hasGroup = /^\(.*\)$/.test(token);
			const hasFrame = token.includes(MarbleDiagramTypeEnum.FRAME);
			const hasTime = /\d+(ms|s|m)/.test(token);
			const hasGroupAndFrame = hasGroup && hasFrame;
			const hasGroupAndTime = hasGroup && hasTime;

			switch (token) {
				case MarbleDiagramTypeEnum.FRAME:
					return this.handleSpaceEvent(acc);
				case MarbleDiagramTypeEnum.COMPLETE:
					return this.handleCompleteEvent(acc);
				case MarbleDiagramTypeEnum.ERROR:
					return this.handleErrorEvent(acc);
				default:
					if (hasGroupAndTime) {
						return this.handleTimedGroupEvent(token, acc);
					}
					if (hasGroupAndFrame) {
						return this.handleComplexGroupEvent(token, acc);
					}
					if (hasGroup) {
						return this.handleGroupEvent(token, acc);
					}
					if (hasTime) {
						return this.handleTimedSpaceEvent(token, acc);
					}
					if (hasEvent) {
						return this.handleCharacterEvent(token, tokens, acc);
					}
					return acc;
			}
		}, accEvents);
	}

	private handleSpaceEvent(acc: MarbleEvent[]): MarbleEvent[] {
		acc.push(...this.getSpaceEvent());
		return acc;
	}

	private replaceGroupToFrame(token: string): string {
		return token.replace('(', '-').replace(')', '-');
	}

	private handleComplexGroupEvent(token: string, acc: MarbleEvent[]): MarbleEvent[] {
		const tokenList = this.replaceGroupToFrame(token).replaceAll(' ', '');
		const tokenListFiltered = this.filterDiagramList(tokenList.split(''));
		const tokenRegexList = tokenListFiltered.map((it) => this.generateRegExp(it));
		return this.createEventsFromTokens(tokenRegexList, acc);
	}

	private handleTimedGroupEvent(token: string, acc: MarbleEvent[]): MarbleEvent[] {
		const tokenFrameList = this.replaceGroupToFrame(token);
		const tokenSpaceInSpecialCharacters = tokenFrameList.replace(/([|#-])/g, ' $1 ');
		const tokenValidList = tokenSpaceInSpecialCharacters.split(' ').filter(Boolean);
		const tokenListFiltered = this.filterDiagramList(tokenValidList);
		const tokenRegexList = tokenListFiltered.map((it) => this.generateRegExp(it));
		return this.createEventsFromTokens(tokenRegexList, acc);
	}

	private handleGroupEvent(token: string, acc: MarbleEvent[]): MarbleEvent[] {
		acc.push(...this.getGroupEvent(token));
		return acc;
	}

	private handleTimedSpaceEvent(token: string, acc: MarbleEvent[]): MarbleEvent[] {
		const msValue = Number(token.replace('ms', '')) || 1;
		acc.push(...this.getSpaceEvent(msValue));
		return acc;
	}

	private handleCharacterEvent(token: string, tokens: RegExpExecArray[], acc: MarbleEvent[]): MarbleEvent[] {
		if (acc.length && acc.at(acc.length - 1)?.type === MarbleEventTypeEnum.EVENT) {
			acc.push(...this.getSpaceFakeHalfEvent());
		}
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
		return Array(count).fill(new MarbleEvent('', '', MarbleEventTypeEnum.SPACE, 1));
	}

	private getSpaceFakeHalfEvent(count = 1): MarbleEvent[] {
		return Array(count).fill(new MarbleEvent('', '', MarbleEventTypeEnum.SPACE_FAKE, 0.1));
	}

	private getSpaceFakeEvent(count = 1): MarbleEvent[] {
		return Array(count).fill(new MarbleEvent('', '', MarbleEventTypeEnum.SPACE_FAKE, 1));
	}

	private getGroupEvent(token: string): MarbleEvent[] {
		const tokenListFiltered = this.filterDiagramList(this.replaceGroupToFrame(token.replaceAll(' ', '')).split(''));
		const subEvents = tokenListFiltered
			.filter((it) => !['|', '#', '-'].includes(it))
			.map((char) => new MarbleEvent(char, this.colorService.backGround, MarbleEventTypeEnum.EVENT));

		return [
			...(tokenListFiltered.at(0) === MarbleDiagramTypeEnum.FRAME ? this.getSpaceEvent() : []),
			new MarbleEvent('', '', MarbleEventTypeEnum.GROUP, 0, subEvents),
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
