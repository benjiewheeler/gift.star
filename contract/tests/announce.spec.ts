import { Blockchain, mintTokens, nameToBigInt } from "@proton/vert";
import { beforeAll, describe, expect, test } from "bun:test";
import { getTableRows } from "./util";

const blockchain = new Blockchain();

const [alice, bob] = blockchain.createAccounts("alice", "bob");
const giftStarContract = blockchain.createContract("gift.star", "contract/gift_star", true);
const eosioTokenContract = blockchain.createContract("eosio.token", "node_modules/proton-tsc/external/eosio.token/eosio.token", true);

describe("announcelink", () => {
    beforeAll(async () => {
        // reset all tables
        blockchain.resetTables();

        //  mint 1000 WAX to each test account
        await mintTokens(eosioTokenContract, "WAX", 8, 3e9, 1e3, [alice, bob]);

        // initialize the smart contract
        await giftStarContract.actions.init({}).send("gift.star@active");
    });

    test("reject irrelevant user auth", () => {
        expect(() =>
            giftStarContract.actions
                .announcelink({
                    creator: "alice",
                    key: "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV",
                    token: { contract: "eosio.token", quantity: "1.00000000 WAX" },
                    memo: "Enjoy :)",
                })
                .send("bob@active")
        ).toThrow(Error("missing required authority alice"));
    });

    test("reject non-existing contract", () => {
        expect(() =>
            giftStarContract.actions
                .announcelink({
                    creator: "alice",
                    key: "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV",
                    token: { contract: "foo.token", quantity: "1.00000000 WAX" },
                    memo: "Enjoy :)",
                })
                .send("alice@active")
        ).toThrow(Error("eosio_assert: contract account does not exist"));
    });

    test("reject non-existing token", () => {
        expect(() =>
            giftStarContract.actions
                .announcelink({
                    creator: "alice",
                    key: "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV",
                    token: { contract: "eosio.token", quantity: "1.0000 FOO" },
                    memo: "Enjoy :)",
                })
                .send("alice@active")
        ).toThrow(Error("eosio_assert: token symbol does not exist"));
    });

    test("reject invalid token amount", () => {
        expect(() =>
            giftStarContract.actions
                .announcelink({
                    creator: "alice",
                    key: "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV",
                    token: { contract: "eosio.token", quantity: "46116860200.00000000 WAX" },
                    memo: "Enjoy :)",
                })
                .send("alice@active")
        ).toThrow(Error("eosio_assert: invalid quantity"));
    });

    test("reject negative token amount", () => {
        expect(() =>
            giftStarContract.actions
                .announcelink({
                    creator: "alice",
                    key: "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV",
                    token: { contract: "eosio.token", quantity: "-1.00000000 WAX" },
                    memo: "Enjoy :)",
                })
                .send("alice@active")
        ).toThrow(Error("eosio_assert: quantity amount must be positive"));
    });

    test("create link", async () => {
        expect(
            giftStarContract.actions
                .announcelink({
                    creator: "alice",
                    key: "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV",
                    token: { contract: "eosio.token", quantity: "1.00000000 WAX" },
                    memo: "Enjoy :)",
                })
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
                    tokens_transferred: false,
                },
            },
        ]);
    });
});
