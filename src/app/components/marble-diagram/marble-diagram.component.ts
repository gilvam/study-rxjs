import { AfterViewInit, Component, Inject, PLATFORM_ID, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { isPlatformBrowser, NgClass } from '@angular/common';
import { MarbleEvent } from './models/marble-event.model';
import { MarbleEventTypeEnum } from './models/marble-event-type.enum';
import { ColorService } from './services/color.service';
import { TimerUtil } from '../../_shared/utils/timer/timer.util';
import { MarbleEventService } from './services/marble-event.service';

@Component({
	selector: 'app-marble-diagram',
	imports: [FormsModule, NgClass, ReactiveFormsModule],
	templateUrl: './marble-diagram.component.html',
	styleUrl: './marble-diagram.component.scss'
})
export class MarbleDiagramComponent implements AfterViewInit {
	// private marbleList = ['ab(cd)(e-f)(g 1000ms h)(i 3s j|)'];
	// private marbleList = ['-a-b|', '-c-d|', 'ef(g|)', '-h(ij|)', '-k(lm|)'];
	// private marbleList = ['a(bc|)', 'a(b|)', 'a|', 'ab', '--'];
	// private marbleList = ['a(bcd|)', 'a(bc|)', 'a(b|)', 'a|'];
	// private marbleList = ['-a-b|', '-c-d-e-f|'];
	private readonly marbleList = ['abcd(ef)---(a|)'];
	private readonly defaultTime = 'ms';

	eventMatrix = signal<MarbleEvent[][]>([]);
	timeType = signal(this.defaultTime);
	form = new FormGroup({
		marbleInputList: new FormArray(this.marbleList.map((it) => new FormControl<string>(it))),
		isTimerEnabled: new FormControl(true)
	});

	constructor(
		@Inject(PLATFORM_ID) private readonly platformId: object,
		private readonly marbleEventService: MarbleEventService,
		public color: ColorService
	) {}

	ngAfterViewInit(): void {
		this.drawDiagram();
	}

	btnDiagramNew(): void {
		this.form.controls.marbleInputList.push(new FormControl<string>(''));
	}

	btnDiagramRemove(index: number): void {
		this.form.controls.marbleInputList.removeAt(index);
		this.eventMatrix.set(this.eventMatrix().filter((_, i) => i !== index));
	}

	getEventClass(type: MarbleEventTypeEnum): Record<string, boolean> {
		return {
			'item--space': [MarbleEventTypeEnum.SPACE, MarbleEventTypeEnum.SPACE_FAKE].includes(type),
			'item--group': [MarbleEventTypeEnum.GROUP, MarbleEventTypeEnum.GROUP_AND_COMPLETE].includes(type),
			'item--event': type === MarbleEventTypeEnum.EVENT,
			'item--complete': type === MarbleEventTypeEnum.COMPLETE,
			'item--complete-group': type === MarbleEventTypeEnum.GROUP_AND_COMPLETE,
			'item--error': type === MarbleEventTypeEnum.ERROR
		};
	}

	isEvent(type: MarbleEventTypeEnum): boolean {
		return type === MarbleEventTypeEnum.EVENT;
	}

	isEventGroup(type: MarbleEventTypeEnum): boolean {
		return [MarbleEventTypeEnum.GROUP, MarbleEventTypeEnum.GROUP_AND_COMPLETE].includes(type);
	}

	drawDiagram(): void {
		if (!isPlatformBrowser(this.platformId)) {
			return;
		}

		this.color.resetIndex();

		const tokenNormalizedUnitList = TimerUtil.normalizeTimeUnits(this.form.getRawValue().marbleInputList.filter((item) => item !== null));
		this.form.controls.marbleInputList.controls.forEach((control, index) => {
			const tokenNormalizedUnits = tokenNormalizedUnitList[index];
			const tokens = this.marbleEventService.tokenizeDiagram(tokenNormalizedUnits);
			const events = this.marbleEventService.createEventsFromTokens(tokens);

			this.eventMatrix.set(Object.assign([...this.eventMatrix()], { [index]: events }));
			this.eventMatrix.set(this.marbleEventService.getNormalizedMatrix(this.eventMatrix()));
			this.timeType.set(
				RegExp(/(ms|s|m)\s/)
					.exec(tokenNormalizedUnitList.join(''))
					?.at(0) ?? this.defaultTime
			);
		});
	}
}
