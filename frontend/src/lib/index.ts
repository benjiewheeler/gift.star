import { Types, abi } from "$lib/contract";
import { ContractKit } from "@wharfkit/contract";
import { APIClient, UInt64, type NameType } from "@wharfkit/session";
import { contractName } from "./contract";

// the url for the wax api
// must also be a hyperion endpoint
export const API_NODE_URL = "https://wax.eosusa.io";

const contractKit = new ContractKit(
    {
        client: new APIClient({ url: API_NODE_URL }),
    },
    {
        abis: [{ abi, name: contractName }],
    }
);

export function waitFor(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export async function fetchBalances(address: string): Promise<LightAPI.TokenBalance[]> {
    const response = await fetch(`https://wax.light-api.net/api/balances/wax/${address}`, {
        method: "GET",
        body: null,
    });

    const json: LightAPI.TokenResponse = await response.json();
    return json.balances;
}

export async function fetchLinkId(trxId: string): Promise<string> {
    // balance between using the hyperion endpoint and the memento one
    const useMemento = Math.random() > 0.5;

    if (useMemento) {
        const tx = await fetchMementoTransaction(trxId);
        const trace = tx?.data?.trace?.action_traces?.find(
            trace => trace?.act?.account == contractName.toString() && trace?.act?.name == "lognewlink"
        );
        return trace?.act?.data["link_id"];
    } else {
        const tx = await fetchHyperionTransaction(trxId);
        const trace = tx?.actions?.find(action => action?.act?.account == contractName.toString() && action?.act?.name == "lognewlink");
        return trace?.act?.data["link_id"];
    }
}

async function fetchMementoTransaction(trxId: string): Promise<MementoAPI.TransactionResponse> {
    const response = await fetch(`https://memento.eu.eosamsterdam.net/wax/get_transaction?trx_id=${trxId}`, {
        method: "GET",
        body: null,
    });

    const json: MementoAPI.TransactionResponse = await response.json();
    return json;
}

async function fetchHyperionTransaction(trxId: string): Promise<Hyperion.TransactionResponse> {
    const response = await fetch(`${API_NODE_URL}/v2/history/get_transaction?id=${trxId}`, {
        method: "GET",
        body: null,
    });

    const json: Hyperion.TransactionResponse = await response.json();
    return json;
}

export async function fetchLinkInfo(linkId: number): Promise<Types.link_s | undefined> {
    const contract = await contractKit.load(contractName);
    const table = contract.table("links");

    try {
        return await table.get(UInt64.from(linkId));
    } catch (error) {
        return undefined;
    }
}

export async function fetchUserLinks(user: NameType): Promise<Types.link_s[] | undefined> {
    const contract = await contractKit.load(contractName);
    const table = contract.table("links");

    try {
        return await table.all({ from: user, to: user, index_position: "2", key_type: "name" });
    } catch (error) {
        return undefined;
    }
}
