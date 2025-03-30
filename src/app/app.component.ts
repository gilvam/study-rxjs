import { AfterViewInit, Component, Inject, PLATFORM_ID, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ColorUtil } from './_shared/utils/color.util';

enum TypeEvent {
  EVENT = 'event',
  COMPLETE = 'complete',
  ERROR = 'error',
  GROUP = 'group',
  SPACE = 'space',
}

class Event {
  constructor(
    public label: string,
    public color: string,
    public type: TypeEvent,
    public subEvents: Event[] = [],
    public flexGrow: number = 0
  ) {
  }
}

class Color {
  private index = 0;

  constructor(public colors: string[]) {
  }

  get backGround(): string {
    return this.colors[this.index++ % this.colors.length];
  }

  backGroundRadialDarken(color: string): string {
    const darken = ColorUtil.hexadecimalToHslDarken(color, 14);
    const lighten = `rgb(from ${ color } r g b / 1)`;
    return `radial-gradient(circle, ${ lighten } 0%, ${ darken } 100%)`;
  }
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  standalone: true,
  template: `
    <div class="container">
      <h2>Marble Testing Visualizer</h2>
      <input type="text" [(ngModel)]="marbleInput" (input)="drawDiagram(marbleInput)" placeholder="Enter Marble Diagram">
      <div class="diagram-container">
        <div class="events-container">
          <div class="timeline"></div>
          <div *ngFor="let event of events()"
               [class.event]="event.type === 'event'"
               [class.complete]="event.type === 'complete'"
               [class.error]="event.type === 'error'"
               [class.group]="event.type === 'group'"
               [class.space]="event.type === 'space'"
               [style.background]="color.backGroundRadialDarken(event.color)"
               [style.flexGrow]="event.flexGrow"
          >
            <ng-container *ngIf="event.type === 'group'">
              <div *ngFor="let subEvent of event.subEvents"
                   class="event"
                   [style.background]="color.backGroundRadialDarken(subEvent.color)"
              >
                {{ subEvent.label }}
              </div>
            </ng-container>
            <ng-container *ngIf="event.type !== 'group' && event.type !== 'space'">
              {{ event.label }}
            </ng-container>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      font-family: Arial, sans-serif;
      display: flex;
      flex-direction: column;
    }

    input {
      padding: 8px;
      margin-bottom: 10px;
      font-size: 16px;
    }

    .diagram-container {
      position: relative;
      width: 100%;
      border: 1px solid #ccc;
      background-color: #f9f9f9;
    }

    .timeline {
      position: absolute;
      top: 50px;
      left: 20px;
      right: 20px;
      height: 2px;
      background-color: #000;
    }

    .events-container {
      display: flex;
      padding: 30px 10px;
      //justify-content: space-evenly;
    }

    .event {
      display: flex;
      position: sticky;
      justify-content: center;
      align-items: center;
      padding: 10px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background-color: #aaaaaa;
      font-weight: bold;
      border: 2px solid #000;
    }

    .space {
      border: none;
      display: flex;
      height: 10px;
    }

    .complete {
      color: black;
      font-size: 48px;
      font-weight: 100;
      margin-top: -11px;
    }

    .error {
      color: red;
      font-size: 40px;
      font-weight: 100;
    }

    .group {
      .event {
        &:not(:first-child) {
          margin-top: -5px;
        }
      }
    }
  `],
})
export class AppComponent implements AfterViewInit {
  // marbleInput = signal('a------b');
  // marbleInput = signal('(a 10ms b)');
  // marbleInput = signal('a---b-----c--d--e--f-g-h-i-j-(k-l)-m-(abc)|');
  // marbleInput = signal('a---b-----c--d--e--f-g-h(a 20ms b)-i-j-(k-l)-m-(abc)|');
  marbleInput = signal('ab');
  events = signal<Event[]>([]);
  color = new Color([
    '#3ea1cb',
    '#ffcb46',
    '#77dd77',
    '#ff9c9c',
    '#6CB0A8',
    '#d3bcf6',
    '#ff7f00',
    '#ffb1ee',
    '#d3dd33',
    '#ff6961',
    '#C1C2AD',
    '#FFD898',
    '#f9f7f7',
    '#b5dccd',
    '#b1becd',
    '#c6b9c0',
    '#a9b8b2',
    '#64a49e'
  ]);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.drawDiagram(this.marbleInput);
    }
  }

  private filterDiagramList(diagramList: string[], ...chars: string[]): string[] {
    const indices = chars.map(char => diagramList.indexOf(char)).filter(index => index !== -1);
    const minIndex = Math.min(...indices);
    return minIndex !== -1 ? diagramList.slice(0, minIndex + 1) : diagramList;
  };

  drawDiagram(diagramList: WritableSignal<string>): void {
    const filteredList = this.filterDiagramList(diagramList().split(''), '#', '|');
    const diagram = filteredList.join('');
    const tokens = this.tokenizeDiagram(diagram);
    const events = this.createEventsFromTokens(tokens);
    this.events.set(events);
  }

  private tokenizeDiagram(diagram: string): RegExpExecArray[] {
    const marbleDiagramRegex = /(\d+ms)|(\(.*?\))|([a-z0-9])|(-)|(\|)|(#)/gi;
    return Array.from(diagram.matchAll(marbleDiagramRegex));
  }

  private regExpExec(token: string): RegExpExecArray {
    return Object.assign([''], { 0: token, index: 0, input: token, groups: undefined });
  }

  private createEventsFromTokens(tokens: RegExpExecArray[], acc: Event[] = []): Event[] {
    return tokens.reduce<Event[]>((acc: Event[], match: RegExpExecArray) => {
      let [token] = match;
      switch (true) {
        case token === '-':
          acc.push(...this.getSpaceEvent());
          break;
        case token.startsWith('(') && token.endsWith(')') && token.includes('-'):
          const tokenList = token.slice(1, -1).split('');
          const tokenReg = tokenList.map(it => this.regExpExec(it));
          return this.createEventsFromTokens(tokenReg, acc);
        case token.startsWith('(') && token.endsWith(')') && /\d+ms/.test(token):
          const tokenList2 = token.slice(1, -1).split(' ');
          const [char, ms, nextChar] = tokenList2;
          const tokenReg2 = [this.regExpExec(char), this.regExpExec(`${ms}`), this.regExpExec(nextChar)];
          return this.createEventsFromTokens(tokenReg2, acc);
        case token.startsWith('(') && token.endsWith(')'):
          acc.push(this.getGroupEvent(token));
          break;
        case /\d+ms/.test(token):
          const msValue = Number(token.replace('ms', '')) || 1;
          acc.push(...this.getSpaceEvent(msValue));
          break;
        case /[a-z0-9]/i.test(token):
          acc.push(this.getEvent(token));
          break;
        case token === '|':
          acc.push(this.getCompleteEvent());
          break;
        case token === '#':
          acc.push(this.getErrorEvent());
          break;
      }
      return acc;
    }, acc);
  }

  private getSpaceEvent(count = 1): Event[] {
    return Array(count).fill(new Event('', '', TypeEvent.SPACE, [], 1));
  }

  private getGroupEvent(token: string): Event {
    const values = token.slice(1, -1).split('');
    const subEvents: Event[] = values.map((char: string) =>
      new Event(char, this.color.backGround, TypeEvent.EVENT)
    );
    return new Event('', '', TypeEvent.GROUP, subEvents, 1);
  }

  private getEvent(token: string): Event {
    return new Event(token, this.color.backGround, TypeEvent.EVENT, []);
  }

  private getCompleteEvent(): Event {
    return new Event('|', '', TypeEvent.COMPLETE, []);
  }

  private getErrorEvent(): Event {
    return new Event('X', '', TypeEvent.ERROR, []);
  }
}
