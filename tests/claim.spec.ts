import { Blockchain, mintTokens, symbolCodeToBigInt } from "@proton/vert";
import { Asset } from "@wharfkit/antelope";
import { beforeAll, describe, expect, test } from "bun:test";
import { generateSignature, getTableRows } from "./util";

const blockchain = new Blockchain();

const [alice, bob] = blockchain.createAccounts("alice", "bob");
const giftStarContract = blockchain.createContract("gift.star", "contract/gift_star", true);
const eosioTokenContract = blockchain.createContract("eosio.token", "node_modules/proton-tsc/external/eosio.token/eosio.token", true);
const privkey = "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3";

describe("claimlink", () => {
    beforeAll(async () => {
        // reset all tables
        blockchain.resetTables();

        //  mint 1000 WAX to each test account
        // this is just to initialize the token stat table
        await mintTokens(eosioTokenContract, "WAX", 8, 3e9, 1e3, [alice]);

        // mint 1000 WAX to the contract account
        // do it this way to avoid triggering the contract notification
        eosioTokenContract.tables["accounts"](giftStarContract.name.value.value).set(
            // ignore the TS error cause by mismatch between @wharfkit/antelope and @greymass/eosio
            // @ts-ignore
            symbolCodeToBigInt(Asset.SymbolCode.from("WAX")),
            giftStarContract.name,
            { balance: Asset.fromString("1000.00000000 WAX") }
        );

        // initialize the smart contract
        await giftStarContract.actions.init({}).send("gift.star@active");

        // create a test link
        await giftStarContract.actions
            .announcelink({
                creator: "alice",
                key: "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV",
                token: { contract: "eosio.token", quantity: "1.00000000 WAX" },
                memo: "link",
            })
            .send("alice@active");
    });

    test("reject irrelevant user auth", () => {
        expect(() =>
            giftStarContract.actions
                .claimlink({ link_id: 1, claimer: "alice", claimer_signature: generateSignature(privkey, "alice") })
                .send("bob@active")
        ).toThrow(Error("missing required authority alice"));
    });

    test("reject non-existing link", () => {
        expect(() =>
            giftStarContract.actions
                .claimlink({ link_id: 1000, claimer: "alice", claimer_signature: generateSignature(privkey, "alice") })
                .send("alice@active")
        ).toThrow(Error("eosio_assert: no link with this id exists"));
    });

    test("reject non-funded links", () => {
        expect(() =>
            giftStarContract.actions
                .claimlink({ link_id: 1, claimer: "alice", claimer_signature: generateSignature(privkey, "foo") })
                .send("alice@active")
        ).toThrow(Error("eosio_assert: tokens for this link have not been transferred yet"));
    });

    test("reject mismatching signature", () => {
        // manipulate the contract data, to simulate when a link has been funded
        giftStarContract.tables["links"](giftStarContract.name.value.value).set(
            // ignore the TS error cause by mismatch between @wharfkit/antelope and @greymass/eosio
            // @ts-ignore
            1n,
            giftStarContract.name,
            {
                creator: "alice",
                key: "PUB_K1_6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5BoDq63",
                link_id: 1,
                memo: "Enjoy :)",
                token: { contract: "eosio.token", quantity: "1.00000000 WAX" },
                tokens_transferred: true,
            }
        );

        expect(() =>
            giftStarContract.actions
                .claimlink({ link_id: 1, claimer: "alice", claimer_signature: generateSignature(privkey, "foo") })
                .send("alice@active")
        ).toThrow(Error("eosio_assert: The signature provided is not valid"));
    });

    test("claim link", async () => {
        expect(
            giftStarContract.actions
                .claimlink({ link_id: 1, claimer: "bob", claimer_signature: generateSignature(privkey, "bob") })
                .send("bob@active")
        ).resolves.toBeNil();

        expect(getTableRows(blockchain, "gift.star", "links")).toEqual([]);

        expect(getTableRows(blockchain, "eosio.token", "accounts", "bob")).toEqual([
            {
                payer: "gift.star",
                // ignore the TS error cause by mismatch between @wharfkit/antelope and @greymass/eosio
                // @ts-ignore
                primaryKey: symbolCodeToBigInt(Asset.SymbolCode.from("WAX")),
                value: { balance: "1.00000000 WAX" },
            },
        ]);
    });
});
