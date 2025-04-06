export enum MarbleDiagramTypeEnum {
	FRAME = '-', // fazer regex
	EVENT = '[a-z0-9]',
	GROUP = '([a-z0-9|#^!]*)',
	TIME = '[a-z0-9] [0-9]+(ms|s|m) [a-z0-9]',
	COMPLETE = '|', // fazer regex
	ERROR = '#', // fazer regex
	SUBSCRIPTION = '^', // fazer regex
	CANCEL = '!' // fazer regex
}

const GROUP_REGEX = new RegExp(/^\(.*\)$/);
