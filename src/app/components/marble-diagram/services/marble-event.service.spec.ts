import { MarbleEventService } from './marble-event.service';
import { MarbleEvent } from '../models/marble-event.model';
import { MarbleEventTypeEnum } from '../models/marble-event-type.enum';
import { TestBed } from '@angular/core/testing';
import { ColorService } from './color.service';
import { Injectable } from '@angular/core';

@Injectable()
class ColorServiceMock extends ColorService {
	override get backGround(): string {
		return '';
	}
}

describe('MarbleEventService', () => {
	let service: MarbleEventService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [MarbleEventService, { provide: ColorService, useClass: ColorServiceMock }]
		});
		service = TestBed.inject(MarbleEventService);
	});

	describe('tokenizeDiagram', () => {
		it('splits and matches diagram tokens', () => {
			const tokens = service.tokenizeDiagram('a-(b|c)-|');
			expect(tokens.map((t) => t[0])).toEqual(['a', '-', 'b', '|']);
		});
		it('returns empty array for empty string', () => {
			expect(service.tokenizeDiagram('')).toEqual([]);
		});
	});

	describe('createEventsFromTokens', () => {
		it('returns empty array when tokens array is empty', () => {
			const tokens = service.tokenizeDiagram('');
			expect(service.createEventsFromTokens(tokens)).toEqual([]);
		});

		it('handles FRAME token correctly', () => {
			const tokens = service.tokenizeDiagram('-');
			expect(service.createEventsFromTokens(tokens)).toEqual(service['getSpaceEvent']());
		});

		it('handles COMPLETE token correctly', () => {
			const tokens = service.tokenizeDiagram('|');
			expect(service.createEventsFromTokens(tokens)).toEqual([service['getCompleteEvent']()]);
		});

		it('handles ERROR token correctly', () => {
			const tokens = service.tokenizeDiagram('#');
			expect(service.createEventsFromTokens(tokens)).toEqual([service['getErrorEvent']()]);
		});

		it('handles GROUP token correctly', () => {
			const tokens = service.tokenizeDiagram('(ab|)');
			expect(service.createEventsFromTokens(tokens)).toEqual([
				new MarbleEvent('', '', MarbleEventTypeEnum.GROUP_AND_COMPLETE, [
					new MarbleEvent('a', '', MarbleEventTypeEnum.EVENT, []),
					new MarbleEvent('b', '', MarbleEventTypeEnum.EVENT, [])
				])
			]);
		});

		it('handles TIME token correctly', () => {
			const tokens = service.tokenizeDiagram('10ms');
			expect(service.createEventsFromTokens(tokens)).toEqual(service['getSpaceEvent'](10));
		});

		it('handles EVENT token correctly', () => {
			const tokens = service.tokenizeDiagram('a');
			expect(service.createEventsFromTokens(tokens)).toEqual([service['getEvent']('a')]);
		});

		it('ignores unrecognized tokens', () => {
			const tokens = service.tokenizeDiagram('?');
			expect(service.createEventsFromTokens(tokens)).toEqual([]);
		});

		it('processes multiple tokens in sequence', () => {
			const tokens = service.tokenizeDiagram('a10ms|');

			const events = service.createEventsFromTokens(tokens);

			expect(events).toEqual([service['getEvent']('a'), ...service['getSpaceEvent'](10), service['getCompleteEvent']()]);
		});

		it('does not add duplicate GROUP_AND_COMPLETE event', () => {
			const acc = [new MarbleEvent('', '', MarbleEventTypeEnum.GROUP_AND_COMPLETE)];
			const tokens = service.tokenizeDiagram('|');
			expect(service.createEventsFromTokens(tokens, acc)).toEqual(acc);
		});
	});

	describe('getNormalizedMatrix', () => {
		it('pads events with SPACE_FAKE to match max length', () => {
			const e1 = [service['getEvent']('a')];
			const e2 = [service['getEvent']('b'), service['getEvent']('c')];
			const matrix = [e1, e2];

			const result = service.getNormalizedMatrix(matrix);

			expect(result[0].length).toBe(result[1].length);
			expect(result[0][1].type).toBe(MarbleEventTypeEnum.SPACE_FAKE);
		});

		it('removes trailing SPACE_FAKE if all rows end with it', () => {
			const e1 = [service['getEvent']('a'), new MarbleEvent('', '', MarbleEventTypeEnum.SPACE_FAKE)];
			const e2 = [service['getEvent']('b'), new MarbleEvent('', '', MarbleEventTypeEnum.SPACE_FAKE)];
			const matrix = [e1, e2];

			const result = service.getNormalizedMatrix(matrix);

			expect(result[0].length).toBe(1);
			expect(result[1].length).toBe(1);
		});
	});

	describe('filterDiagramList', () => {
		it('returns slice up to error or complete char', () => {
			const diagram = ['a', '-', '#', 'b'];
			expect(service['filterDiagramList'](diagram)).toEqual(['a', '-', '#']);
		});

		it('returns full list if no error or complete', () => {
			const diagram = ['a', '-', 'b'];
			expect(service['filterDiagramList'](diagram)).toEqual(['a', '-', 'b']);
		});

		it('handles closing parenthesis after error/complete', () => {
			const diagram = ['a', '-', '#', ')', 'b'];
			expect(service['filterDiagramList'](diagram)).toEqual(['a', '-', '#', ')']);
		});
	});

	describe('getEvent', () => {
		it('creates event with correct type and color', () => {
			const event = service['getEvent']('x');
			expect(event.type).toBe(MarbleEventTypeEnum.EVENT);
			expect(event.label).toBe('x');
		});
	});

	describe('getCompleteEvent', () => {
		it('creates complete event', () => {
			const event = service['getCompleteEvent']();
			expect(event.type).toBe(MarbleEventTypeEnum.COMPLETE);
		});
	});

	describe('getErrorEvent', () => {
		it('creates error event', () => {
			const event = service['getErrorEvent']();
			expect(event.type).toBe(MarbleEventTypeEnum.ERROR);
			expect(event.label).toBe('X');
		});
	});

	describe('getGroupEvent', () => {
		it('creates group event with subevents', () => {
			const events = service['getGroupEvent']('(ab)');
			expect(events[0].type).toBe(MarbleEventTypeEnum.GROUP);
			expect(events[0].subEvents.length).toBe(2);
		});

		it('creates GROUP_AND_COMPLETE if group contains complete', () => {
			const events = service['getGroupEvent']('(a|)');
			expect(events[0].type).toBe(MarbleEventTypeEnum.GROUP_AND_COMPLETE);
		});

		it('adds space event if group ends with frame', () => {
			const events = service['getGroupEvent']('(ab-)');
			expect(events.length).toBe(2);
			expect(events[1].type).toBe(MarbleEventTypeEnum.SPACE);
		});
	});

	describe('getSpaceEvent', () => {
		it('returns array of SPACE events of given count', () => {
			const events = service['getSpaceEvent'](3);
			expect(events.length).toBe(3);
			expect(events.every((e) => e.type === MarbleEventTypeEnum.SPACE)).toBe(true);
		});

		it('returns one SPACE event by default', () => {
			const events = service['getSpaceEvent']();
			expect(events.length).toBe(1);
			expect(events[0].type).toBe(MarbleEventTypeEnum.SPACE);
		});
	});

	describe('getSpaceFakEvent', () => {
		it('returns array of SPACE_FAKE events of given count', () => {
			const events = service['getSpaceFakEvent'](2);
			expect(events.length).toBe(2);
			expect(events.every((e) => e.type === MarbleEventTypeEnum.SPACE_FAKE)).toBe(true);
		});
	});

	describe('replaceGroupToFrame', () => {
		it('removes parentheses from token', () => {
			expect(service['replaceGroupToFrame']('(ab)')).toBe('ab');
		});
	});
});
