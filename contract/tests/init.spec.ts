import { Blockchain, mintTokens } from "@proton/vert";
import { beforeAll, describe, expect, test } from "bun:test";

const blockchain = new Blockchain();

const [alice, bob] = blockchain.createAccounts("alice", "bob");
const giftStarContract = blockchain.createContract("gift.star", "contract/gift_star", true);
const eosioTokenContract = blockchain.createContract("eosio.token", "node_modules/proton-tsc/external/eosio.token/eosio.token", true);

describe("init", () => {
    beforeAll(async () => {
        // reset all tables
        blockchain.resetTables();

        //  mint 1000 WAX to each test account
        await mintTokens(eosioTokenContract, "WAX", 8, 3e9, 1e3, [alice, bob]);
    });

    test("reject user auth", () => {
        expect(() => giftStarContract.actions.init({}).send("alice@active")).toThrow(Error("missing required authority gift.star"));
    });

    test("allow contract auth", async () => {
        expect(giftStarContract.actions.init({}).send("gift.star@active")).resolves.toBeNil();
    });
});
