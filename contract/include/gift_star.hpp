#include "eosio/contract.hpp"

#include <eosio/asset.hpp>
#include <eosio/crypto.hpp>
#include <eosio/eosio.hpp>
#include <eosio/singleton.hpp>
#include <eosio/transaction.hpp>

using namespace eosio;
using namespace std;

CONTRACT gift_star : public contract
{
public:
    using contract::contract;

    // ------------ admin actions ------------

    ACTION init();

    // ------------ user actions ------------

    ACTION announcelink(const name& creator, const public_key& key, const extended_asset& token, const string& memo);

    ACTION cancellink(const uint64_t& link_id);

    ACTION claimlink(const uint64_t& link_id, const name& claimer, const signature& claimer_signature);

    // ------------ inline contract actions ------------

    ACTION loglinkstart(const uint64_t& link_id);

    ACTION lognewlink(const uint64_t& link_id, const name& creator, const public_key& key, const extended_asset& token, const string& memo);

    // ------------ notify handlers ------------

    // receiver token from the user
    void receivetoken(name from, name to, asset quantity, string memo);

private:
    // token stat struct
    // taken from the reference eosio.token contract
    // https://github.com/AntelopeIO/reference-contracts/blob/main/contracts/eosio.token/include/eosio.token/eosio.token.hpp
    struct stat_s {
        asset supply;
        asset max_supply;
        name issuer;

        uint64_t primary_key() const { return supply.symbol.code().raw(); }
    };

    TABLE link_s
    {
        uint64_t link_id;
        name creator;
        public_key key;
        extended_asset token;
        bool tokens_transferred;
        string memo;

        auto primary_key() const { return link_id; }

        // secondary index to sort/query the links by the creator
        uint64_t by_creator() const { return creator.value; }
    };

    TABLE config
    {
        // version of the smart contract
        string version = "1.0.0";

        // counter of the links created
        uint64_t link_counter;
    };

    // token stat table definition
    typedef multi_index<name("stat"), stat_s> stat_t;

    typedef multi_index<name("links"), link_s,
        indexed_by<name("creator"), const_mem_fun<link_s, uint64_t, &link_s::by_creator>>>
        link_t;

    typedef singleton<name("config"), config> config_t;
};