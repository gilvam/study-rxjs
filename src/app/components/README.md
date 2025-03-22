# rxjs 
Essa ordem facilita o aprendizado começando pelo básico, avançando para padrões de uso comuns e finalizando com técnicas mais avançadas.

## 1. Conceitos Fundamentais

### Introdução
* O que é o RxJS e Programação Reativa

### Observable
* O que é um `Observable` e como ele funciona.
* Diferença entre `Observable` e `Promise`.
* Como criar `Observables` com `Observable.create()`, `of()`, `from()` e `interval()`.

### Observer
* Papel do `Observer` e sua inscrição em um `Observable`.
* Como lidar com os eventos `next`, `error` e `complete`.

### Subscription
* Como gerenciar inscrições e evitar vazamentos de memória.
* Uso do `unsubscribe()` para limpar inscrições corretamente.

### Subject
* O que são `Subjects`, `BehaviorSubjects`, `ReplaySubjects` e `AsyncSubjects`.
* Como eles funcionam como `Observable` e `Observer` simultaneamente.

### Operators vs. Subjects vs. Schedulers
* **Operators:** Funções usadas para transformar, combinar e manipular fluxos de dados.
* **Subjects:** Atuam como Observables e Observers simultaneamente, permitindo multicast de valores.
* **Schedulers:** Controlam quando e como a execução dos Observables ocorre (ex: `asyncScheduler`, `queueScheduler`).

## 2. Criação de Observables
* `of`, `from`
* `fromEvent`
* `interval`, `timer` 
* `range`, `generate`
* `defer`, `throwError`

## 3. Manipulação de Fluxo (Pipe e Operadores Básicos)
* `pipe`
* `map`, `tap`
* `filter`
* `first`, `last`, `find`

## 4. Operadores de Transformação
* `mergeMap`
* `switchMap`
* `concatMap`
* `exhaustMap`
* `scan`
* `buffer`, `bufferTime`, `bufferCount`

## 5. Combinação de Observables
* `combineLatest`
* `forkJoin`
* `merge`
* `concat`
* `zip`
* `startWith`, `withLatestFrom`

## 6. Controle de Tempo e Estado
* `delay`, `delayWhen`
* `throttleTime`, `throttle`
* `debounceTime`, `debounce`
* `auditTime`, `audit`
* `timeout`, `timeoutWith`

## 7. Tratamento de Erros
* `catchError`
* `retry`, `retryWhen`
* `onErrorResumeNext`

## 8. Operadores de Estado e Acumulação
* `reduce`
* `count`
* `defaultIfEmpty`
* `every`
* `distinct`, `distinctUntilChanged`, `distinctUntilKeyChanged`

## 9. Sujeitos (Subjects)
* `Subject`
* `BehaviorSubject`
* `ReplaySubject`
* `AsyncSubject`

## 10. Multicast e Compartilhamento
* `share`, `shareReplay`
* `publish`, `publishReplay`, `publishBehavior`
* `refCount`

## 11. Operadores Avançados e Personalizados
* `groupBy`
* `window`, `windowTime`, `windowCount`
* `partition`
* Criação de operadores personalizados com `lift`

## 12. Integração com Angular
* Uso do async `pipe`
* `HttpClient` e RxJS
* `ActivatedRoute` com observables
* Gerenciamento de estados reativos com `RxJS` e `Signals`
* RxJS em formulários reativos (`FormControl.valueChanges`)

-------------------------------
# V2 com mais tipos

2. Criação de Observables
of, from
fromEvent, fromEventPattern
interval, timer, animationFrames
range, generate
defer, throwError, iif, scheduled, using
ajax, fromFetch, webSocket

3. Manipulação de Fluxo (Pipe e Operadores Básicos)
pipe
map, tap
filter, skip, skipLast, skipUntil, skipWhile, take, takeLast, takeUntil, takeWhile
first, last, find, findIndex, single
finalize, dematerialize, materialize, observeOn, subscribeOn

4. Operadores de Transformação
mergeMap, mergeAll, mergeScan
switchMap, switchAll, switchScan
concatMap, concatAll, concatWith
exhaustMap, exhaustAll
scan, expand
buffer, bufferTime, bufferCount, bufferToggle, bufferWhen

5. Combinação de Observables
combineLatest, combineLatestAll, combineLatestWith
forkJoin
merge, mergeWith
concat
zip, zipAll, zipWith
startWith, withLatestFrom, pairwise
race, raceWith
sequenceEqual, endWith

6. Controle de Tempo e Estado
delay, delayWhen
throttleTime, throttle
debounceTime, debounce
auditTime, audit
timeout, timeoutWith
timeInterval, timestamp
sample, sampleTime

7. Tratamento de Erros
catchError
retry, retryWhen
onErrorResumeNext, onErrorResumeNextWith
throwIfEmpty

8. Operadores de Estado e Acumulação
reduce
count
defaultIfEmpty
every
distinct, distinctUntilChanged, distinctUntilKeyChanged
elementAt, isEmpty
max, min

9. Sujeitos (Subjects)
Subject
BehaviorSubject
ReplaySubject
AsyncSubject

10. Multicast e Compartilhamento
share, shareReplay
publish, publishReplay, publishBehavior
refCount
connect, connectable

11. Operadores Avançados e Personalizados
groupBy
window, windowTime, windowCount, windowToggle, windowWhen
partition
Criação de operadores personalizados com lift

12. Integração com Angular
Uso do async pipe
HttpClient e RxJS
ActivatedRoute com observables
Gerenciamento de estados reativos com RxJS e Signals
RxJS em formulários reativos (FormControl.valueChanges)


http://angular.io/guide/rx-library
https://rxjs.dev/guide/overview
https://www.learnrxjs.io/
