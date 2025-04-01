import { AfterViewInit, Component, Inject, PLATFORM_ID, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser, NgForOf, NgIf } from '@angular/common';
import { MarbleEvent } from './models/marble-event.model';
import { TypeEvent } from './models/type-event.enum';
import { ColorService } from './services/color.service';

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
		//     'ab'
		// 'a---b-----c--d--e--f-g-h-i-j-(k-l)-m-(abc)|'
		//  'ab-c--d(e 10ms f)(g-h)(ij)-k|'
		'ab-c-(cd)-e-f-|'
	);

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
		const filteredList = this.filterDiagramList(diagramList().split(''), '#', '|');
		const diagram = filteredList.join('');
		const tokens = this.tokenizeDiagram(diagram);
		const events = this.createEventsFromTokens(tokens);
		events.push(...this.getSpaceFakeEvent(1));
		this.events.set(events);
	}

	private filterDiagramList(diagramList: string[], ...chars: string[]): string[] {
		const indices = chars.map((char) => diagramList.indexOf(char)).filter((index) => index !== -1);
		const minIndex = Math.min(...indices);
		return minIndex !== -1 && diagramList[minIndex + 1] !== ')'
			? diagramList.slice(0, minIndex + 1)
			: diagramList.slice(0, minIndex + 2);
	}

	private tokenizeDiagram(diagram: string): RegExpExecArray[] {
		const marbleDiagramRegex = /(\d+ms)|(\(.*?\))|([a-z0-9])|(-)|(\|)|(#)/gi;
		return Array.from(diagram.matchAll(marbleDiagramRegex));
	}

	private createEventsFromTokens(tokens: RegExpExecArray[], accEvents: MarbleEvent[] = []): MarbleEvent[] {
		return tokens.reduce<MarbleEvent[]>((acc: MarbleEvent[], match: RegExpExecArray) => {
			const [token] = match;
			switch (true) {
				case token === '-':
					return this.handleSpaceEvent(acc);
				case token.startsWith('(') && token.endsWith(')') && token.includes('-'):
					return this.handleComplexGroupEvent(token, acc);
				case token.startsWith('(') && token.endsWith(')') && /\d+ms/.test(token):
					return this.handleTimedGroupEvent(token, acc);
				case token.startsWith('(') && token.endsWith(')'):
					return this.handleGroupEvent(token, acc);
				case /\d+ms/.test(token):
					return this.handleTimedSpaceEvent(token, acc);
				case /[a-z0-9]/i.test(token):
					return this.handleCharacterEvent(token, tokens, acc);
				case token === '|':
					return this.handleCompleteEvent(acc);
				case token === '#':
					return this.handleErrorEvent(acc);
				default:
					return acc;
			}
		}, accEvents);
	}

	private handleSpaceEvent(acc: MarbleEvent[]): MarbleEvent[] {
		acc.push(...this.getSpaceEvent());
		return acc;
	}

	private handleComplexGroupEvent(token: string, acc: MarbleEvent[]): MarbleEvent[] {
		const tokenList = token.replace('(', '-').replace(')', '-').split('');
		const tokenReg = tokenList.map((it) => this.generateRegExp(it));
		return this.createEventsFromTokens(tokenReg, acc);
	}

	private handleTimedGroupEvent(token: string, acc: MarbleEvent[]): MarbleEvent[] {
		const tokenMsList = token.slice(1, -1).split(' ');
		const [char, ms, nextChar] = tokenMsList;
		const tokenMsReg = [
			this.generateRegExp('-'),
			this.generateRegExp(char),
			this.generateRegExp(`${ms}`),
			this.generateRegExp(nextChar),
			this.generateRegExp('-')
		];
		return this.createEventsFromTokens(tokenMsReg, acc);
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
		if (acc.length && acc.at(acc.length - 1)?.type === TypeEvent.EVENT) {
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
		if (!acc.find((event) => event.type === TypeEvent.EVENT_AND_COMPLETE)) {
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
		return Array(count).fill(new MarbleEvent('', '', TypeEvent.SPACE, 1));
	}

	private getSpaceFakeHalfEvent(count = 1): MarbleEvent[] {
		return Array(count).fill(new MarbleEvent('', '', TypeEvent.SPACE_FAKE, 0.1));
	}

	private getSpaceFakeEvent(count = 1): MarbleEvent[] {
		return Array(count).fill(new MarbleEvent('', '', TypeEvent.SPACE_FAKE, 1));
	}

	private getGroupEvent(token: string): MarbleEvent[] {
		const values = token.slice(1, -1).split('');
		const events: MarbleEvent[] = [];

		if (values.some((it) => it === '|')) {
			events.push(this.getCompleteEvent());
		}
		if (values.some((it) => it === '#')) {
			events.push(this.getErrorEvent());
		}

		const subEvents: MarbleEvent[] = values
			.filter((it) => !['|', '#'].includes(it))
			.map((char: string) => new MarbleEvent(char, this.colorService.backGround, TypeEvent.EVENT));
		return [new MarbleEvent('', '', TypeEvent.GROUP, 0, subEvents), ...events];
	}

	private getEvent(token: string): MarbleEvent {
		return new MarbleEvent(token, this.colorService.backGround, TypeEvent.EVENT);
	}

	private getEventAndComplete(token: string): MarbleEvent {
		return new MarbleEvent(token, this.colorService.backGround, TypeEvent.EVENT_AND_COMPLETE);
	}

	private getCompleteEvent(): MarbleEvent {
		return new MarbleEvent('', '', TypeEvent.COMPLETE);
	}

	private getErrorEvent(): MarbleEvent {
		return new MarbleEvent('X', '', TypeEvent.ERROR);
	}
}
