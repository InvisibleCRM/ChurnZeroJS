
export function mockFn<T extends (...args: any[]) => any>() {
	return jest.fn<ReturnType<T>, Parameters<T>>();
}
