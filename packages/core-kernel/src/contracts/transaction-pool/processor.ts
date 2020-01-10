import { Interfaces } from "@arkecosystem/crypto";

// todo: check if this interface is still needed or if we can ditch it.
export interface Processor {
    validate(transactions: Interfaces.ITransactionData[]): Promise<ProcessorResult>;

    getTransactions(): Interfaces.ITransactionData[];
    getBroadcastTransactions(): Interfaces.ITransaction[];
    getErrors(): { [key: string]: TransactionErrorResponse[] };

    pushError(transaction: Interfaces.ITransactionData, type: string, message: string): void;
}

export interface ProcessorResult {
    accept: string[];
    broadcast: string[];
    invalid: string[];
    excess: string[];
    errors: { [key: string]: TransactionErrorResponse[] } | undefined;
}

export interface TransactionErrorResponse {
    type: string;
    message: string;
}