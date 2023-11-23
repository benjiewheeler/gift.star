import { Blockchain } from "@proton/vert";
import { PrivateKey } from "@wharfkit/antelope";

export function getTableRows<T>(blockchain: Blockchain, code: string, table: string, scope?: string): T[] {
    type Storage = {
        [contract: string]: {
            [table: string]: {
                [scope: string]: T[];
            };
        };
    };

    return (blockchain.getStorage() as Storage)?.[code]?.[table]?.[scope ?? code] ?? [];
}

export function generateSignature(privkey: string, payload: string) {
    return PrivateKey.fromString(privkey).signDigest(new Bun.CryptoHasher("sha256").update(payload).digest());
}
