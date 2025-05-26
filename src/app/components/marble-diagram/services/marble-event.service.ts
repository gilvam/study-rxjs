import { Injectable } from '@angular/core';
import { MarbleEvent } from '../models/marble-event.model';
import { EnumUtil } from '../../../_shared/utils/enum.util';
import { MarbleDiagramTypeEnum } from '../models/marble-diagram-type.enum';
import { MarbleEventTypeEnum } from '../models/marble-event-type.enum';
import { ColorService } from './color.service';

@Injectable({ providedIn: 'root' })
export class MarbleEventService {
	private readonly maxRepeat = 100;

	constructor(private readonly color: ColorService) {}

	tokenizeDiagram(token: string): RegExpExecArray[] {
		const filteredList = this.filterDiagramList(token.split(''));
		const diagram = filteredList.join('');
		const matchTimeUnitGroupEventCharDashCompleteError = /(\d+(ms|s|m))|(\(.*?\))|([a-z0-9])|(-)|(\|)|(#)/gi;
		return Array.from(diagram.matchAll(matchTimeUnitGroupEventCharDashCompleteError));
	}

	getNormalizedMatrix(eventMatrix: MarbleEvent[][]): MarbleEvent[][] {
		const maxCount = Math.max(...eventMatrix.map((events) => events.length));
		const evt = eventMatrix.map((events) => [...events, ...this.getSpaceFakEvent(maxCount - events.length)]);

		return evt.every((events) => events.at(-1)?.type === MarbleEventTypeEnum.SPACE_FAKE) ? evt.map((events) => events.slice(0, -1)) : evt;
	}

	createEventsFromTokens(tokens: RegExpExecArray[], accEvents: MarbleEvent[] = []): MarbleEvent[] {
		const handler = (acc: MarbleEvent[], token = '') => {
			const hasEvent = /[a-z0-9]/i.test(token);
			const hasGroup = /^\(.*\)$/.test(token);
			const hasTime = /\d+(ms|s|m)/.test(token);
			const isFrame = EnumUtil.isEqual(token, MarbleDiagramTypeEnum.FRAME);
			const isComplete = EnumUtil.isEqual(token, MarbleDiagramTypeEnum.COMPLETE);
			const isError = EnumUtil.isEqual(token, MarbleDiagramTypeEnum.ERROR);

			const handlers = [
				{ condition: isFrame, handler: () => this.handleSpaceEvent(acc) },
				{ condition: isComplete, handler: () => this.handleCompleteEvent(acc) },
				{ condition: isError, handler: () => this.handleErrorEvent(acc) },
				{ condition: hasGroup, handler: () => this.handleGroupEvent(token, acc) },
				{ condition: hasTime, handler: () => this.handleTimedSpaceEvent(token, acc) },
				{ condition: hasEvent, handler: () => this.handleCharacterEvent(token, acc) }
			];

			return handlers.find((handle) => handle.condition)?.handler() || acc;
		};

		for (const token of tokens) {
			accEvents = handler(accEvents, token.at(0));
		}

		return accEvents;
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

	private handleCharacterEvent(token: string, acc: MarbleEvent[]): MarbleEvent[] {
		acc.push(this.getEvent(token));
		return acc;
	}

	private handleCompleteEvent(acc: MarbleEvent[]): MarbleEvent[] {
		if (!acc.find((event) => event.type === MarbleEventTypeEnum.GROUP_AND_COMPLETE)) {
			acc.push(this.getCompleteEvent());
		}
		return acc;
	}

	private handleErrorEvent(acc: MarbleEvent[]): MarbleEvent[] {
		acc.push(this.getErrorEvent());
		return acc;
	}

	private handleSpaceEvent(acc: MarbleEvent[]): MarbleEvent[] {
		acc.push(...this.getSpaceEvent());
		return acc;
	}

	private filterDiagramList(
		diagramList: string[],
		chars: string[] = [MarbleDiagramTypeEnum.ERROR, MarbleDiagramTypeEnum.COMPLETE]
	): string[] {
		const indices = chars.map((char) => diagramList.indexOf(char)).filter((index) => index !== -1);
		const minIndex = Math.min(...indices);
		return minIndex !== -1 && diagramList[minIndex + 1] !== ')' ? diagramList.slice(0, minIndex + 1) : diagramList.slice(0, minIndex + 2);
	}

	private getEvent(token: string): MarbleEvent {
		return new MarbleEvent(token, this.color.backGround, MarbleEventTypeEnum.EVENT);
	}

	private getCompleteEvent(): MarbleEvent {
		return new MarbleEvent('', '', MarbleEventTypeEnum.COMPLETE);
	}

	private getErrorEvent(): MarbleEvent {
		return new MarbleEvent('X', '', MarbleEventTypeEnum.ERROR);
	}

	private getGroupEvent(token: string): MarbleEvent[] {
		const tokenListFiltered = this.filterDiagramList(this.replaceGroupToFrame(token.replaceAll(' ', '')).split(''));
		const hasComplete = tokenListFiltered.some((it) => EnumUtil.isEqual(it, MarbleDiagramTypeEnum.COMPLETE));
		const noSpecialChars = tokenListFiltered.filter((it) => !['|', '#'].includes(it));
		const marbleEvent = hasComplete ? MarbleEventTypeEnum.GROUP_AND_COMPLETE : MarbleEventTypeEnum.GROUP;

		const subEvents = noSpecialChars.map((char) => new MarbleEvent(char, this.color.backGround, MarbleEventTypeEnum.EVENT));

		return [
			new MarbleEvent('', '', marbleEvent, subEvents),
			...(EnumUtil.isEqual(tokenListFiltered.at(-1), MarbleDiagramTypeEnum.FRAME) ? this.getSpaceEvent() : [])
		];
	}

	private getSpaceEvent(count = 1): MarbleEvent[] {
		return Array.from({ length: count }, () => new MarbleEvent('', '', MarbleEventTypeEnum.SPACE));
	}

	private getSpaceFakEvent(count = 1): MarbleEvent[] {
		return Array.from({ length: count }, () => new MarbleEvent('', '', MarbleEventTypeEnum.SPACE_FAKE));
	}

	private replaceGroupToFrame(token: string): string {
		return token.replace(/[()]/g, '');
	}
}
