import { TypeEvent } from "./type-event.enum";

export class MarbleEvent {
	constructor(
		public label: string,
		public color: string,
		public type: TypeEvent,
		public flexGrow: number = 0,
		public subEvents: MarbleEvent[] = []
	) {}
}
