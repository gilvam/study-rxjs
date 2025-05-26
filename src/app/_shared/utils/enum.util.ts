export class EnumUtil {
	static isEqual<T>(value: string | null | undefined, enumValue: T): boolean {
		return String(value) === String(enumValue);
	}
}
