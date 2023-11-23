// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
    namespace App {
        // interface Error {}
        // interface Locals {}
        // interface PageData {}
        // interface Platform {}
    }

    namespace LightAPI {
        interface TokenBalance {
            contract: string;
            decimals: string;
            amount: string;
            currency: string;
        }

        interface TokenResponse {
            account_name: string;
            balances: TokenBalance[];
            chain: {
                network: string;
                description: string;
                block_num: number;
                decimals: number;
                rex_enabled: number;
                sync: number;
                production: number;
                block_time: string;
                chainid: string;
                systoken: string;
            };
        }
    }

    namespace MementoAPI {
        interface TransactionResponse {
            known: boolean;
            irreversible: boolean;
            data: {
                trace: {
                    action_traces: {
                        act: {
                            account: string;
                            name: string;
                            authorization: { actor: string; permission: string }[];
                            data: any;
                        };
                    }[];
                };
            };
        }
    }

    namespace Hyperion {
        interface TransactionResponse {
            actions: {
                act: {
                    account: string;
                    name: string;
                    authorization: { actor: string; permission: string }[];
                    data: any;
                };
            }[];
        }
    }
}

export {};
