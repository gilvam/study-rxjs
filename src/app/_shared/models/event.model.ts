import { TypeEvent } from './type-event.enum';

export class Event {
  constructor(
    public left: number,
    public top: number,
    public label: string,
    public color: string,
    public  type: TypeEvent,
    public subEvents: Event[] = []
  ) {
  }
}
