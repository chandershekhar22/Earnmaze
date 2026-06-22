export interface User {
	id: string;
	email: string;
	name?: string;
	userType: string;
	status: 'active' | 'suspended' | 'pending';
	tier?: string;
	createdAt: Date;
}

export interface AuthState {
	user: User | null;
	isLoading: boolean;
	error: string | null;
}

export interface LoginCredentials {
	email: string;
	password: string;
	turnstileToken?: string;
}

export interface RegisterData {
	email: string;
	password: string;
	name?: string;
	turnstileToken?: string;
	referralCode?: string;
	utmSource?: string;
	utmMedium?: string;
	utmCampaign?: string;
	registrationSource?: string;
	// Required acknowledgements — must all be true.
	ageVerified: true;
	tosAccepted: true;
	privacyAccepted: true;
	// Optional marketing opt-in.
	marketingConsent?: boolean;
}
