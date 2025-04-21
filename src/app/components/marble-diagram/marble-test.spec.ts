import { TestScheduler } from 'rxjs/internal/testing/TestScheduler';
import { combineLatest, delay, map, merge, Observable, of, skip, startWith, Subject } from 'rxjs';
// import { concat, concatMap, delay, Observable, of } from 'rxjs';

describe('Marble Testing', () => {
	let testScheduler: TestScheduler;

	beforeEach(() => {
		testScheduler = new TestScheduler((actual, expected) => {
			expect(actual).toEqual(expected);
		});
	});

	describe('00', () => {
		it('should understand marble diagram', () => {
			testScheduler.run(({ cold, expectObservable }) => {
				const source = cold('--');
				const expected = '--';

				expectObservable(source).toBe(expected);
			});
		});

		it('should support basic values provided as params (number)', () => {
			testScheduler.run(({ cold, expectObservable }) => {
				const source = cold('-a-|', { a: 0 });
				const expected = '-a-|';

				expectObservable(source).toBe(expected, { a: 0 });
			});
		});

		it('should support custom erros', () => {
			testScheduler.run(({ cold, expectObservable }) => {
				const source = cold('--#', undefined, new Error('Oops!'));
				const expected = '--#';

				expectObservable(source).toBe(expected, undefined, new Error('Oops!'));
			});
		});

		it('should support multiple emission in the same time frame', () => {
			testScheduler.run(({ expectObservable }) => {
				const source = of(1, 2, 3);

				expectObservable(source).toBe('(abc|)', { a: 1, b: 2, c: 3 });
			});
		});

		it('should support testing subscriptions', () => {
			testScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
				const source = hot('-a-^b---c-|', { a: 1, b: 2, c: 3, d: 4 });
				const subscription = '   ^------!';
				const expectedMarbles = '-b---c-|';
				const expectedValues = { a: 1, b: 2, c: 3 };

				expectObservable(source).toBe(expectedMarbles, expectedValues);
				expectSubscriptions(source.subscriptions).toBe(subscription);
			});
		});

		it('should multiply by "2" each value emitted', () => {
			testScheduler.run(({ cold, expectObservable }) => {
				const source = cold('a-b-c-|', { a: 1, b: 2, c: 3 });
				const expectedMarbles = 'a-b-c-|';
				const expectedValues = { a: 2, b: 4, c: 6 };

				const result = source.pipe(map((it) => it * 2));

				expectObservable(result).toBe(expectedMarbles, expectedValues);
			});
		});
	});

	describe('01', () => {
		function lightBulb(switch1$: Observable<boolean>): Observable<boolean> {
			return switch1$;
		}

		//Unit test (no marbles yet)
		test('should light the bulb when switch is on', (done) => {
			const switch$ = new Subject<boolean>();

			lightBulb(switch$).subscribe({
				next: (isLightOn) => {
					expect(isLightOn).toEqual(true);
					done();
				}
			});

			switch$.next(true);
		});

		// Unit test with marbles
		test('should light the bulb when switch is on', () => {
			testScheduler.run(({ hot, expectObservable }) => {
				const switch$ = hot('i', { i: true });

				const result$ = lightBulb(switch$);

				expectObservable(result$).toBe('i', { i: true });
			});
		});
	});

	describe('02', () => {
		function lightBulb(switch1$: Observable<boolean>): Observable<boolean> {
			return switch1$.pipe(delay(10));
		}

		// Adding more blocks to the test
		it('should light the bulb after 10ms delay', () => {
			testScheduler.run(({ hot, expectObservable }) => {
				const switch$ = hot('i', { i: true });

				const result$ = lightBulb(switch$);

				expectObservable(result$).toBe('----------i', { i: true });
				// equals to
				expectObservable(result$).toBe('10ms i', { i: true });
			});
		});
	});

	describe('03', () => {
		function lightBulbWithStaircaseWiring(
			switch1$: Observable<boolean>,
			switch2$: Observable<boolean>
		): Observable<boolean> {
			return combineLatest([switch1$.pipe(startWith(false)), switch2$.pipe(startWith(false))]).pipe(
				map(([s1, s2]) => s1 !== s2),
				skip(1)
			);
		}

		it('it should light the bulb ON and OFF if switches are switching', () => {
			testScheduler.run(({ hot, expectObservable }) => {
				const switch1$: any = hot('---i---o---i', { i: true, o: false });
				const switch2$: any = hot('-i---o---i--', { i: true, o: false });
				const expected$: any = '   -i-o-i-o-i-o';

				const result$ = lightBulbWithStaircaseWiring(switch1$, switch2$);

				expectObservable(result$).toBe(expected$, { i: true, o: false });
			});
		});

		it('it should light the bulb ON and OFF if switches are switching', () => {
			const switch1$ = new Subject<boolean>();
			const switch2$ = new Subject<boolean>();

			const resultArray: boolean[] = [];

			jest.useFakeTimers();

			lightBulbWithStaircaseWiring(switch1$, switch2$).subscribe({
				next: (isLightOn) => {
					resultArray.push(isLightOn);
				}
			});

			switch1$.next(true);
			jest.advanceTimersByTime(1);
			switch2$.next(true);
			jest.advanceTimersByTime(1);
			switch1$.next(false);
			jest.advanceTimersByTime(1);
			switch2$.next(false);
			jest.advanceTimersByTime(1);
			switch1$.next(true);
			jest.advanceTimersByTime(1);
			switch2$.next(true);

			expect(resultArray).toEqual([true, false, true, false, true, false]);
		});
	});
});

describe('Marble: (abc)(d-e)(f 10ms g) - 01', () => {
	it('should emit values according to marble diagram', () => {
		const scheduler = new TestScheduler((actual, expected) => {
			expect(actual).toEqual(expected);
		});

		scheduler.run(({ expectObservable, cold }) => {
			const sourceMarble = '(abc)(d-e)f----------g|';
			const expectedMarble = '(abc)(d-e)f----------g|';

			const source$ = cold(sourceMarble);

			expectObservable(source$).toBe(expectedMarble);
		});
	});
});

describe('Marble: (abc)(d-e)(f 10ms g) - 02', () => {
	it('should emit values according to marble diagram', () => {
		const scheduler = new TestScheduler((actual, expected) => {
			expect(actual).toEqual(expected);
		});

		scheduler.run(({ cold, expectObservable }) => {
			const values = { a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g' };
			const sourceMarble = '(abc)(d-e)f 10ms g|';
			const expectedMarble = '(abc)(d-e)f 10ms g|';

			const source$ = cold(sourceMarble, values);

			expectObservable(source$).toBe(expectedMarble, values);
		});
	});
});

describe('marble test map', () => {
	let scheduler: TestScheduler;

	beforeEach(() => {
		scheduler = new TestScheduler((actual, expected) => {
			expect(actual).toEqual(expected);
		});
	});

	it('deve multiplicar os valores de um observable por 10', () => {
		scheduler.run(({ cold, expectObservable }) => {
			const sourceValues = { a: 1, b: 2, c: 3 };
			const source$ = cold('a-b--c|', sourceValues);

			const expectedValues = { a: 10, b: 20, c: 30 };
			const expected$ = cold('a-b--c|', expectedValues);

			const result$ = source$.pipe(map((it) => it * 10));

			expectObservable(result$).toEqual(expected$);
		});
	});
});

describe('marble test group emissions', () => {
	let scheduler: TestScheduler;

	beforeEach(() => {
		scheduler = new TestScheduler((actual, expected) => {
			expect(actual).toEqual(expected);
		});
	});

	it('deve emitir valores como (abc)(d-e)(f 10ms g)', () => {
		scheduler.run(({ cold, expectObservable }) => {
			const group1 = cold('(abc)', { a: 'a', b: 'b', c: 'c' });
			const group2 = cold('(d-e)', { d: 'd', e: 'e' }).pipe(delay(5, scheduler));
			const group3 = cold('(f 10ms g)', { f: 'f', g: 'g' }).pipe(delay(10, scheduler));

			const expectedMarble = '(abc)(d 1ms e)(f----------g)';
			const expectedValues = { a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g' };

			const source$ = merge(group1, group2, group3);
			// .pipe(tap((v) => console.log(scheduler.now(), 'val:', v)));

			expectObservable(source$).toBe(expectedMarble, expectedValues);
		});
	});

	it('deve emitir valores como (abc)(d-e)(f 10ms g)', () => {
		scheduler.run(({ cold, expectObservable, time }) => {
			// delays com time()
			const delayGroup2 = time('(abc)|'); // equivale a 30ms
			const delayGroup3 = time('(abc)(d-e)|'); // equivale a 100ms
			const groupA = cold('(abc)', { a: 'a', b: 'b', c: 'c' });
			const groupB = cold('(d-e)', { d: 'd', e: 'e' }).pipe(delay(delayGroup2, scheduler));
			const groupC = cold('(f 10ms g)', { f: 'f', g: 'g' }).pipe(delay(delayGroup3, scheduler));

			const expectedMarble = '(abc)(d-e)(f 10ms g)';
			const expectedValues = { a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g' };

			const source$ = merge(groupA, groupB, groupC);

			expectObservable(source$).toBe(expectedMarble, expectedValues);
		});
	});
});
