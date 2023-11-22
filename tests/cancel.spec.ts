import { Blockchain, mintTokens } from "@proton/vert";
import { beforeAll, describe, expect, test } from "bun:test";
import { getTableRows } from "./util";

const blockchain = new Blockchain();

const [alice, bob] = blockchain.createAccounts("alice", "bob");
const giftStarContract = blockchain.createContract("gift.star", "contract/gift_star", true);
const eosioTokenContract = blockchain.createContract("eosio.token", "node_modules/proton-tsc/external/eosio.token/eosio.token", true);

describe("cancellink", () => {
    beforeAll(async () => {
        // reset all tables
        blockchain.resetTables();

        //  mint 1000 WAX to each test account
        // this is just to initialize the token stat table
        await mintTokens(eosioTokenContract, "WAX", 8, 3e9, 1e3, [alice, bob]);

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

    test("reject non-existing link", () => {
        expect(() => giftStarContract.actions.cancellink({ link_id: 500 }).send("alice@active")).toThrow(
            Error("eosio_assert: no link with this id exists")
        );
    });

    test("reject non-authorized user", () => {
        expect(() => giftStarContract.actions.cancellink({ link_id: 1 }).send("bob@active")).toThrow(Error("missing required authority alice"));
    });

    test("delete link", () => {
        expect(giftStarContract.actions.cancellink({ link_id: 1 }).send("alice@active")).resolves.toBeNil();

        expect(getTableRows(blockchain, "gift.star", "links")).toEqual([]);
    });
});
