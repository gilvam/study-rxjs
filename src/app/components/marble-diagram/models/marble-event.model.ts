import { MarbleEventTypeEnum } from './marble-event-type.enum';

export class MarbleEvent {
	constructor(
		public label: string,
		public color: string,
		public type: MarbleEventTypeEnum,
		public subEvents: MarbleEvent[] = []
	) {}
}
