declare global {
	interface String {
		capitalize(): string;
		capitalizeWords(): string;
	}
}

String.prototype.capitalize = function (): string {
	if (this.length === 0) {
		return this as string;
	}
	return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.capitalizeWords = function (): string {
	return this.replace(/\b\w/g, (char) => char.toUpperCase());
};
