import { firstValueFrom, interval, lastValueFrom, of, take, throttleTime, toArray } from 'rxjs';
import { TestScheduler } from 'rxjs/internal/testing/TestScheduler';

describe('Testes defaults que usamos diariamente', () => {
	it.skip('deveria testar os 2 valores mas testei apenas o primeiro', (done) => {
		const input$ = of(0, 1);

		input$.subscribe((value) => {
			console.log(`value: `, value); // 0... 1
			expect(value).toBe(0);
			done();
		});
	});

	it.skip('deveria testar os 2 valores e funcionou. E se existir 3 retornos?', async () => {
		const input$ = of(0, 1);

		const first = await firstValueFrom(input$);
		const last = await lastValueFrom(input$);

		expect(first).toBe(0);
		expect(last).toBe(1);
	});

	it.skip('deveria testar os 2 valores transformando o resultado em array. E se existir 3 retornos ou 4?', (done) => {
		const input$ = of(0, 1);
		const output$ = input$.pipe(toArray());

		output$.subscribe((value) => {
			console.log('value', value); // [0, 1]
			expect(value).toEqual([0, 1]);
			done();
		});
	});

	it.skip('deveria testar multiplos valores do interval. Tempo excedido...', (done) => {
		const input$ = interval(1000);
		const output$ = input$.pipe(toArray());

		output$.subscribe((value) => {
			console.log('value', value); // INFINITO
			expect(value).toEqual([0, 1]); // ??? never called ???
			done();
		});
	});

	it.skip('deveria testar multiplos valores do interval usando take. Seria um teste correto?', (done) => {
		const input$ = interval(1000);
		const output$ = input$.pipe(take(2), toArray());

		output$.subscribe((value) => {
			console.log('value', value); // [0, 1]
			expect(value).toEqual([0, 1]); // true
			done();

			/*
			 * PROBLEMA 1: não testa se cada valor é emitido após 1 ms

		      O operador toArray() espera o Observable completar para coletar todos os valores em um array. Só depois ele emite um único valor (o array).
				Logo, você não está testando os tempos entre as emissões individuais, apenas se os dois valores [0, 1] foram emitidos no final.

				* Por que isso é um problema?
					* O teste não verifica o comportamento temporal do interval(1000), apenas o resultado acumulado.
					* Se o interval estivesse emitindo tudo de uma vez (o que não é o caso real), o teste ainda passaria.
					* Ou seja: o tempo entre as emissões não está sendo verificado.

			 * PROBLEMA 2: de alguma forma o teste done() foi feito. Não é real / valido

			      Esse problema é mais sutil e se refere à natureza assíncrona e ao tempo real da execução.

					Explicação:
					* Como o interval(1000) leva 2 segundos para emitir dois valores e completar, o done() só será chamado após 2 segundos reais.
					* Esse teste parece funcionar, mas:
						* Ele não é confiável para ambientes de CI/CD (teste pode falhar por tempo).
						* Ele é lento (espera 2 segundos desnecessariamente).
						* Ele não usa ferramentas adequadas de controle de tempo como fakeAsync, TestScheduler ou jest.useFakeTimers().
			 */
		});
	});

	it.skip('deveria testar multiplos valores do interval usando take. Seria um teste correto com um interval tão alto?', (done) => {
		const input$ = interval(10_000); // teste de 10 em 10 segundos
		const output$ = input$.pipe(take(2), toArray());

		output$.subscribe((value) => {
			console.log('value 04', value); // [0, 1]
			expect(value).toEqual([0, 1]); // true
			done();
		});
		/*
		 * PROBLEMA 1:
		 * Requer uma quantidade real de tempo para realmente passar nos testes e vai demorar MUITO
		 *
		 * PROBLEMA 2:
		 * Temporizadores reais tornam o comportamento imprevisível, logo, o comportamento não determinístico resulta em testes inconsistentes
		 * Esses temporizadores introduzem indeterminismo, resultando em testes instáveis e demorados.
		 */
	});
});

/**
 O que devemos fazer?
 Testar o código assíncrono de forma síncrona e deterministica

 Como?
 Virtualizando o tempo... criando fake clocks. Fake out timers, like setTimeout
 */

describe('Testes iniciando com fake clocks', () => {
	it.skip('deveria testar multiplos valores com fake clock. Ainda não está realmente afirmando a sequência de tempo...', () => {
		const input$ = interval(1);
		const output$ = input$.pipe(take(2), toArray());
		jest.advanceTimersByTime(2);

		output$.subscribe((value) => {
			console.log('value', value); // [0, 1]
			expect(value).toEqual([0, 1]); // true
		});
	});

	it.skip('deveria testar multiplos valores com fake clock e buffer. Funciona... seria ideal?', () => {
		jest.useFakeTimers();
		const input$ = interval(1);
		const output$ = input$.pipe(take(2));
		const buffer: number[] = [];
		jest.useFakeTimers();

		output$.subscribe((value) => buffer.push(value));

		expect(buffer).toEqual([]);

		jest.advanceTimersByTime(1);
		expect(buffer).toEqual([0]);

		jest.advanceTimersByTime(1);
		expect(buffer).toEqual([0, 1]);

		/**
		 * Muito verboso...
		 * Sequencias complexas podem ser difíceis de corrdenar e raciocinar.
		 */
	});
});

/**
 *  É possível representar valores declarativamente ao longo do tempo?
 *  Sim, usando o conceito de "marble diagrams" (diagramas de mármore).

 ab -> 0ms 1ms
        a   b

 (ab) -> 0ms
         ab
 // o simbolo "()" representa um grupo de eventos que ocorrem no mesmo tempo / simcrono

 a-b -> 0ms 1ms 2ms
         a   -   b

 a--b -> 0ms 1ms 2ms 3ms
         a    -   -   b

 a---------b -> 0ms 1ms 2ms 3ms 4ms 5ms 6ms 7ms 8ms 9ms 10ms
                 a    -   -   -   -   -   -   -   -   -   b

 a 9ms b ->     0ms 1ms 2ms 3ms 4ms 5ms 6ms 7ms 8ms 9ms 10ms
                 a    -   -   -   -   -   -   -   -   -   b

 a 1ms b| ->   0ms          1ms          2ms          3ms
                a            -            b        completed()
 // each marble takes up a 1ms "frame"

 a 1ms (b|) -> 0ms          1ms          2ms
                a           -       b e completed()


 * error -> #
 * unsubscribe -> !
 * complete -> |
 * space -> -
 * group -> ()
 * explicar sobre cold e hot

 * */

describe('Testes iniciando com Marble Diagrams', () => {
	let testScheduler: TestScheduler;

	beforeEach(() => {
		// cria uma nova instância de teste para cada um dos testes isolados nos it()
		testScheduler = new TestScheduler((actual, expected) => {
			expect(actual).toEqual(expected);
		});
	});

	it.skip('deveria testar multiplos valores com marble. Ainda com o take forçando o termino do interval', () => {
		const input$ = interval(1);
		const output$ = input$.pipe(take(2));
		const expected = '-a(b|)'; // marble diagram representation
		const sub = '---'; // subscription com 3 valores

		// tudo aqui dentro é virtualizado
		testScheduler.run((helpers) => {
			const { expectObservable } = helpers;

			expectObservable(output$, sub).toBe(expected, { a: 0, b: 1 });
		});
	});

	it.skip('deveria testar multiplos valores com marble. Usando a função interval pura.', () => {
		const input$ = interval(1);
		const output$ = input$;
		const expected = '-ab '; // marble diagram representation
		const sub = '     ---!'; // subscription com 3 valores e um "!", no caso unsubscribe matando o interval

		testScheduler.run((helpers) => {
			const { expectObservable } = helpers;

			expectObservable(output$, sub).toBe(expected, { a: 0, b: 1 });
		});
	});
});

describe('Testes com Marble Diagrams, novos exemplos', () => {
	function someExemple() {
		return interval(5).pipe(throttleTime(100));
	}

	let testScheduler: TestScheduler;

	beforeEach(() => {
		testScheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
	});

	it.skip('deveria validar o someExemple.', () => {
		testScheduler.run((helpers) => {
			const { expectObservable } = helpers;
			const output$ = someExemple();
			const expected = '5ms a';
			const sub = '     5ms 105ms !';

			expectObservable(output$, sub).toBe(expected, { a: 0 });
		});
	});

	it.skip('deveria validar o someExemple com mais valores.', () => {
		testScheduler.run((helpers) => {
			const { expectObservable } = helpers;
			const output$ = someExemple();
			const expected = '5ms a 104ms b';
			const sub = '     5ms 106ms !';

			expectObservable(output$, sub).toBe(expected, { a: 0, b: 21 });
		});
	});

	it('deveria validar o someExemple com cold.', () => {
		testScheduler.run((helpers) => {
			const { expectObservable } = helpers;
			const output$ = someExemple();
			const expected = '5ms a 104ms b 104ms c';
			const sub = '     5ms 211ms !';

			expectObservable(output$, sub).toBe(expected, { a: 0, b: 21, c: 42 });
		});
	});
});
