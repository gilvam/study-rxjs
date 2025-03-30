import { AfterViewInit, Component, Inject, PLATFORM_ID, signal } from '@angular/core';
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
  ) {}
}

class Color {
  private index = 0;

  constructor(public colors: string[]) {}

  get backGround(): string {
    return this.colors[this.index++ % this.colors.length];
  }

  backGroundRadialDarken(color: string): string {
    const darken = ColorUtil.hexadecimalToHslDarken(color, 14);
    const lighten = `rgb(from ${color} r g b / 1)`;
    return `radial-gradient(circle, ${lighten} 0%, ${darken} 100%)`;
  }
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  standalone: true,
  template: `
    <div class="container">
      <h2>Marble Testing Visualizer</h2>
      <input type="text" [(ngModel)]="marbleInput" (input)="drawDiagram()" placeholder="Enter Marble Diagram">
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
      height: 200px;
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
      margin-top: -12px;
    }
    .error {
      color: red;
      font-size: 40px;
      font-weight: 100;
      margin-top: -1px;
    }
    .group {
      //display: flex;
      > .event {
        &:not(first-child) {
          margin-top: -5px;
        }
      }
    }
  `],
})
export class AppComponent implements AfterViewInit {
  marbleInput = signal('a---b-----c--d--e--f-g-h-i--(abc)|');
  events = signal<Event[]>([]);
  color = new Color(['#3ea1cb', '#00ffb0', '#ffcb46', '#ff7f00', '#6CB0A8', '#97D49B', '#CCB8D7', '#C1C2AD', '#FFD898', '#68BBE3', '#189AB4']);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.drawDiagram();
    }
  }

  private filterDiagramList (diagramList: string[], ...chars: string[]): string[] {
    const indices = chars.map(char => diagramList.indexOf(char)).filter(index => index !== -1);
    const minIndex = Math.min(...indices);
    return minIndex !== -1 ? diagramList.slice(0, minIndex + 1) : diagramList;
  };

  drawDiagram() {
    const diagramList = this.marbleInput().split('');
    const filteredList = this.filterDiagramList(diagramList, '#', '|');
    const diagram = filteredList.join('');
    const marbleDiagramRegex = /(\d+ms)|(\(.*?\))|([a-z0-9])|(-)|(\|)|(#)/gi;
    const tokens = Array.from(diagram.matchAll(marbleDiagramRegex));
    const y = 41;

    let dashCount = 0;

    const events: Event[] = tokens.reduce((acc, match: any, i: number) => {
      const [token] = match;
      if (token === '-') {
        dashCount++;
        if(dashCount > 0){
          acc.push(new Event('', '', TypeEvent.SPACE, [], 0.1));
        }
      } else if (token.match(/\d+ms/)) {
        acc.push(new Event('', '', TypeEvent.SPACE, [], 0.1));
      } else if (token.startsWith('(') && token.endsWith(')')) {
        const values = token.slice(1, -1).split('');
        const subEvents: Event[] = values.map((char: string) =>
          new Event(char, this.color.backGround, TypeEvent.EVENT)
        );
        acc.push(new Event('', '', TypeEvent.GROUP, subEvents, 0.1));
        dashCount = 0;
      } else if (token.match(/[a-z0-9]/i)) {
        acc.push(new Event(token, this.color.backGround, TypeEvent.EVENT, []));
        dashCount = 0;
      } else if (token === '|') {
        acc.push(new Event('|', '', TypeEvent.COMPLETE, [], 0.1));
        dashCount = 0;
      } else if (token === '#') {
        acc.push(new Event('X', '', TypeEvent.ERROR, [], 0.1));
        dashCount = 0;
      }

      return acc;
    }, [] as Event[]);

    this.events.set(events);
  }
}
