import { Blockchain, mintTokens, nameToBigInt, symbolCodeToBigInt } from "@proton/vert";
import { Asset } from "@wharfkit/antelope";
import { beforeAll, describe, expect, test } from "bun:test";
import { getTableRows } from "./util";

const blockchain = new Blockchain();

const [alice, bob] = blockchain.createAccounts("alice", "bob");
const giftStarContract = blockchain.createContract("gift.star", "contract/gift_star", true);
const eosioTokenContract = blockchain.createContract("eosio.token", "node_modules/proton-tsc/external/eosio.token/eosio.token", true);

describe("notification", () => {
    beforeAll(async () => {
        // reset all tables
        blockchain.resetTables();

        //  mint 1000 WAX to each test account
        await mintTokens(eosioTokenContract, "WAX", 8, 3e9, 1e3, [alice, bob]);
        await mintTokens(eosioTokenContract, "EOS", 4, 1e9, 1e3, [alice, bob]);

        // initialize the smart contract
        await giftStarContract.actions.init({}).send("gift.star@active");

        // create a test link
        await giftStarContract.actions
            .announcelink({
                creator: "alice",
                key: "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV",
                token: { contract: "eosio.token", quantity: "1.00000000 WAX" },
                memo: "Enjoy :)",
            })
            .send("alice@active");
    });

    test("reject invalid memo", () => {
        expect(() =>
            eosioTokenContract.actions
                .transfer({ from: "alice", to: "gift.star", quantity: "1.00000000 WAX", memo: "Enjoy :)" })
                .send("alice@active")
        ).toThrow(Error("eosio_assert: Invalid memo"));
    });

    test("reject insufficient quantity", () => {
        expect(() =>
            eosioTokenContract.actions
                .transfer({ from: "alice", to: "gift.star", quantity: "0.10000000 WAX", memo: "link" })
                .send("alice@active")
        ).toThrow(Error("eosio_assert: Insufficient quantity"));
    });

    test("reject non-existing link (creator)", () => {
        expect(() =>
            eosioTokenContract.actions.transfer({ from: "bob", to: "gift.star", quantity: "1.00000000 WAX", memo: "link" }).send("bob@active")
        ).toThrow(Error("eosio_assert: No announced link by this sender for this token exists"));
    });

    test("reject non-existing link (token)", () => {
        expect(() =>
            eosioTokenContract.actions.transfer({ from: "bob", to: "gift.star", quantity: "1.0000 EOS", memo: "link" }).send("bob@active")
        ).toThrow(Error("eosio_assert: No announced link by this sender for this token exists"));
    });

    test("fund link", async () => {
        expect(
            eosioTokenContract.actions
                .transfer({ from: "alice", to: "gift.star", quantity: "10.00000000 WAX", memo: "link" })
                .send("alice@active")
        ).resolves.toBeNil();

        expect(getTableRows(blockchain, "gift.star", "links")).toEqual([
            {
                payer: "alice",
                primaryKey: 1n,
                secondaryIndexes: [{ type: "idxu64", value: nameToBigInt("alice") }],
                value: {
                    creator: "alice",
                    key: "PUB_K1_6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5BoDq63",
                    link_id: 1,
                    memo: "Enjoy :)",
                    token: { contract: "eosio.token", quantity: "1.00000000 WAX" },
                    tokens_transferred: true,
                },
            },
        ]);

        expect(getTableRows(blockchain, "eosio.token", "accounts", "alice")).toEqual([
            {
                payer: "eosio.token",
                // ignore the TS error cause by mismatch between @wharfkit/antelope and @greymass/eosio
                // @ts-ignore
                primaryKey: symbolCodeToBigInt(Asset.SymbolCode.from("EOS")),
                value: { balance: "1000.0000 EOS" },
            },
            {
                payer: "alice",
                // ignore the TS error cause by mismatch between @wharfkit/antelope and @greymass/eosio
                // @ts-ignore
                primaryKey: symbolCodeToBigInt(Asset.SymbolCode.from("WAX")),
                value: { balance: "999.00000000 WAX" },
            },
        ]);
    });
});
