
// https://support.churnzero.net/hc/en-us/articles/360004683552-Integrate-ChurnZero-using-Javascript

type int = number;
type double = number;
type date = Date;
type datetime = Date;

interface StandardEntityAttributes {
	account: {
		Name: string;
		NextRenewalDate: date;
		TotalContractAmount: double;
		IsActive: boolean;
		BillingAddressLine1: string;
		BillingAddressLine2: string;
		BillingAddressCity: string;
		BillingAddressState: string;
		BillingAddressZip: string;
		StartDate: datetime;
		EndDate: datetime;
		LicenseCount: int;
		OwnerUserAccount: string;
		ParentAccountExternalId: string;
	};

	contact: {
		FirstName: string;
		LastName: string;
		Email: string;
	}
}

type EntityType = keyof StandardEntityAttributes;

interface Methods {
	setAppKey(key: string): void;
	setContact(accountExternalId: string, contactExternalId: string): void;
	trackEvent(name: string, description?: string, quantity?: number, customFields?: Record<string, any>): void;
	setAttribute<E extends EntityType, N extends keyof E>(entity: EntityType, name: N, value: E[N]): void;
	setAttribute<E extends EntityType>(entity: EntityType, attributes: Partial<StandardEntityAttributes[E]>): void;
	incrementAttribute<E extends EntityType>(entity: E, name: string | number | symbol/*keyof StandardEntityAttributes[E]*/, value: number): void;
	stop(): void;
	setModule(module: string): void;
	urltracking(enabled: boolean): void;
	silent(enabled: boolean): void;
	open(): void;
	close(): void;
}

type PushArgs = { [P in keyof Methods]: [P, ...Parameters<Methods[P]>] }[keyof Methods];

interface ChurnZero {
	push<Args extends PushArgs>(args: Args): void;
	verify(): void;
	debug(): void;
}

export interface ChurnZeroAPI {
	ChurnZero: ChurnZero;
}

const churnZeroAPI: Partial<ChurnZeroAPI> = window as any;

type ExposedMethods = Omit<Methods, 'setAppKey' | 'setContact' | 'stop'>;

export interface Config {
	url: string;
	apiKey: string;
	accountId: string;
	contactId: string;
}

export class Client implements ExposedMethods {
	private static async embedScript(url: string) {
		return new Promise<void>((resolve, reject) => {
			var scripts = document.getElementsByTagName('script');
			if(!document.getElementById("ChurnZero")){
				const f = document.getElementsByTagName('script')[0], j = document.createElement('script');
				j.async = true;
				j.src = url;
				j.id = "ChurnZero"
				j.crossOrigin = 'anonymous';
				f.parentNode!.insertBefore(j, f);

				j.onload = () => {
					resolve();
				};

				j.onerror = (event, source, lineno, colno, error) => {
					reject(new Error(`Failed to load ChurnZero script. ${typeof event == 'string' ? event : ''} ${error?.message}`));
				}
			}
		});
	}

	private constructor(private methods: ChurnZero) {
	}

	static async connect(config: Config) {
		await Client.embedScript(config.url);
		const churnZero = churnZeroAPI.ChurnZero;
		if (!churnZero)
			throw new Error('ChurnZero object is not initialized by embedded script.');

		churnZero.push(['setAppKey', config.apiKey]);
		churnZero.push(['setContact', config.accountId, config.contactId]);

		return new Client(churnZero);
	}

	trackEvent(...args: Parameters<Methods['trackEvent']>) {
		this.methods.push(['trackEvent', ...args]);
	}

	setAttribute<E extends EntityType>(entity: EntityType, attributes: Partial<StandardEntityAttributes[E]>) {
		this.methods.push(['setAttribute', entity, attributes]);
	}

	incrementAttribute<E extends EntityType>(entity: E, name: keyof StandardEntityAttributes[E], value: number) {
		this.methods.push(['incrementAttribute', entity, name, value]);
	}

	setModule(...args: Parameters<Methods['setModule']>) {
		this.methods.push(['setModule', ...args]);
	}

	urltracking(...args: Parameters<Methods['urltracking']>) {
		this.methods.push(['urltracking', ...args]);
	}

	silent(...args: Parameters<Methods['silent']>) {
		this.methods.push(['silent', ...args]);
	}

	open(...args: Parameters<Methods['open']>) {
		this.methods.push(['open', ...args]);
	}

	close(...args: Parameters<Methods['close']>) {
		this.methods.push(['close', ...args]);
	}
}
