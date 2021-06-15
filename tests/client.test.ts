import * as faker from "faker";
import { ChurnZeroAPI, Client, Config } from "../src";
import { mockFn } from "./helpers";

function generateCfg() {
	const result: Config = {
		url: faker.internet.url(),
		apiKey: faker.datatype.uuid(),
		accountId: faker.datatype.uuid(),
		contactId: faker.datatype.uuid(),
	};

	return result;
}

function fakeChurnZeroApi() {
	const api = window as Partial<ChurnZeroAPI>;
	return api.ChurnZero = {
		push: mockFn<ChurnZeroAPI['ChurnZero']['push']>(),
		verify: mockFn<ChurnZeroAPI['ChurnZero']['verify']>(),
		debug: mockFn<ChurnZeroAPI['ChurnZero']['debug']>(),
	}
}

describe('Client', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		const someScript = document.createElement('script');
		document.body.appendChild(someScript);
	});

	describe('connecting', () => {
		it('loads script by URL', async () => {
			// INIT
			const cfg = generateCfg();
			const insertBefore = jest.spyOn(document.body, 'insertBefore');

			// ACT
			Client.connect(cfg);

			// ASSERT
			expect(insertBefore).toBeCalledTimes(1);
			const script = insertBefore.mock.calls[0][0] as HTMLScriptElement;
			expect(script.src).toEqual(cfg.url + '/');
			expect(script.async).toBeTruthy();
			expect(script.onload).toEqual(expect.any(Function));
			expect(script.onerror).toEqual(expect.any(Function));
			expect(script.crossOrigin).toEqual('anonymous');
		});

		it('fail on script loading', async () => {
			// INIT
			const cfg = generateCfg();
			const insertBefore = jest.spyOn(document.body, 'insertBefore');
			const client = Client.connect(cfg);
			const script = insertBefore.mock.calls[0][0] as HTMLScriptElement;
			const errorEvent = faker.datatype.string();
			const errorMessage = faker.datatype.string();

			// ACT
			script.onerror!(
				errorEvent,
				faker.datatype.string(),
				faker.datatype.number(),
				faker.datatype.number(),
				new Error(errorMessage)
			);

			// ASSERT
			await expect(client).rejects.toBeInstanceOf(Error);
			await expect(client).rejects.toEqual(new Error(`Failed to load ChurnZero script. ${errorEvent} ${errorMessage}`));

			// ACT / ASSERT - does not crash
			script.onerror!({} as Event);
		});

		it('uninitilized ChurnZero API', async () => {
			// INIT
			const cfg = generateCfg();
			const insertBefore = jest.spyOn(document.body, 'insertBefore');
			const client = Client.connect(cfg);
			const script = insertBefore.mock.calls[0][0] as HTMLScriptElement;

			// ACT
			script.onload!(undefined as any);

			// ACT
			await expect(client).rejects.toBeInstanceOf(Error);
		});

		it('happy path', async () => {
			// INIT
			const cfg = generateCfg();
			const insertBefore = jest.spyOn(document.body, 'insertBefore');
			const client = Client.connect(cfg);
			const script = insertBefore.mock.calls[0][0] as HTMLScriptElement;

			// ACT
			const api = fakeChurnZeroApi();
			script.onload!(undefined as any);

			// ACT
			await expect(client).resolves.toBeDefined();
			expect(api.push).toBeCalledTimes(2);
			expect(api.push).nthCalledWith(1, ['setAppKey', cfg.apiKey]);
			expect(api.push).nthCalledWith(2, ['setContact', cfg.accountId, cfg.contactId]);
		});
	});

	it('delegate calls', async () => {
		// INIT
		const cfg = generateCfg();
		const insertBefore = jest.spyOn(document.body, 'insertBefore');
		const clientPromise = Client.connect(cfg);
		const script = insertBefore.mock.calls[0][0] as HTMLScriptElement;
		const api = fakeChurnZeroApi();
		script.onload!(undefined as any);
		const client = await clientPromise;
		const trackEventArgs: Parameters<Client['trackEvent']> = [faker.datatype.string()];
		const setAttributeArgs: Parameters<Client['setAttribute']> = ['contact', { 'FirstName': faker.datatype.string() }];
		const setModuleArgs: Parameters<Client['setModule']> = [faker.datatype.string()];
		jest.resetAllMocks();

		// ACT
		client.trackEvent(...trackEventArgs);
		client.open();
		client.close();
		client.incrementAttribute('account', 'LicenseCount', 123);
		client.setAttribute(...setAttributeArgs);
		client.setModule(...setModuleArgs);
		client.urltracking(true);
		client.silent(true);

		// ASSERT
		expect(api.push).nthCalledWith(1, ['trackEvent', ...trackEventArgs]);
		expect(api.push).nthCalledWith(2, ['open']);
		expect(api.push).nthCalledWith(3, ['close']);
		expect(api.push).nthCalledWith(4, ['incrementAttribute', 'account', 'LicenseCount', 123]);
		expect(api.push).nthCalledWith(5, ['setAttribute', ...setAttributeArgs]);
		expect(api.push).nthCalledWith(6, ['setModule', ...setModuleArgs]);
		expect(api.push).nthCalledWith(7, ['urltracking', true]);
		expect(api.push).nthCalledWith(8, ['silent', true]);
	});
});
