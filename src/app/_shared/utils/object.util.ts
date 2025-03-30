export class ObjectUtil {
	static isEmpty<T extends Record<string, unknown> | undefined>(
		obj: T,
	): boolean {
		if (!obj) {
			return true;
		}

		return !Object.keys(obj).some(
			(key) => obj[key] !== undefined && obj[key] !== null,
		);
	}
}
