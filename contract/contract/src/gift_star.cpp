#include <gift_star.hpp>

ACTION gift_star::init()
{
    require_auth(get_self());

    // get config table
    config_t conf_tbl(get_self(), get_self().value);

    // check if a config exists
    check(!conf_tbl.exists(), "smart contract is already initialized");

    // create a config if it doesn't exist
    conf_tbl.get_or_create(get_self(), config {});
}

ACTION gift_star::announcelink(const name& creator, const public_key& key, const extended_asset& token, const string& memo)
{
    require_auth(creator);

    // get config table instance
    config_t conf_tbl(get_self(), get_self().value);

    // check if the contract is initialized
    check(conf_tbl.exists(), "smart contract has not been initialized yet");

    // check if the contract exists
    check(is_account(token.contract), "contract account does not exist");

    // check if the contract has a token and is valid
    const auto& token_symbol = token.get_extended_symbol().get_symbol();
    stat_t stat_tbl(token.contract, token_symbol.code().raw());
    stat_tbl.require_find(token_symbol.code().raw(), "token symbol does not exist");

    // check if quantity is valid
    check(token.quantity.is_valid(), "invalid quantity");
    check(token.quantity.amount > 0, "quantity amount must be positive");

    // check the memo size
    check(memo.size() <= 256, "memo has more than 256 bytes");

    // get the links table instance
    link_t link_tbl(get_self(), get_self().value);

    // increment the link counter
    auto conf = conf_tbl.get();
    const auto& new_link_id = ++conf.link_counter;

    // save the new link count
    conf_tbl.set(conf, get_self());

    // add the link to the table
    link_tbl.emplace(creator, [&](link_s& row) {
        row.link_id = new_link_id;
        row.creator = creator;
        row.key = key;
        row.token = token;
        row.tokens_transferred = false;
        row.memo = memo;
    });

    // log the newly created link
    action(permission_level { get_self(), name("active") },
        get_self(), name("lognewlink"),
        std::make_tuple(new_link_id, creator, key, token, memo))
        .send();
}

ACTION gift_star::cancellink(const uint64_t& link_id)
{
    // get the links table instance
    link_t link_tbl(get_self(), get_self().value);

    // find if the link exists
    const auto& link_itr = link_tbl.require_find(link_id, "no link with this id exists");

    // check for the authorization from the link's creator
    require_auth(link_itr->creator);

    // send back the tokens to the creator if they have already sent them
    if (link_itr->tokens_transferred) {
        action(permission_level { get_self(), name("active") },
            link_itr->token.contract, name("transfer"),
            std::make_tuple(get_self(), link_itr->creator, link_itr->token.quantity, std::string("Cancelled link")))
            .send();
    }

    // delete the link
    link_tbl.erase(link_itr);
}

ACTION gift_star::claimlink(const uint64_t& link_id, const name& claimer, const signature& claimer_signature)
{
    require_auth(claimer);

    // get the links table instance
    link_t link_tbl(get_self(), get_self().value);

    // find if the link exists
    const auto& link_itr = link_tbl.require_find(link_id, "no link with this id exists");

    // verify that the link has been funded first
    check(link_itr->tokens_transferred, "tokens for this link have not been transferred yet");

    // verify the signature is correct
    const auto& claimer_str = claimer.to_string();
    const auto& payload = claimer_str.c_str();
    const auto& digest = sha256(payload, claimer_str.size());
    const auto& key = recover_key(digest, claimer_signature);
    check(key == link_itr->key, "The signature provided is not valid");

    // send the tokens to the claimer
    action(permission_level { get_self(), name("active") },
        link_itr->token.contract, name("transfer"),
        std::make_tuple(get_self(), claimer, link_itr->token.quantity, std::string("Claimed link")))
        .send();

    // delete the link
    link_tbl.erase(link_itr);
}

[[eosio::on_notify("*::transfer")]] void
gift_star::receivetoken(name from, name to, asset quantity, string memo)
{
    print(from, to, quantity, memo);

    // abort if the receiver is not the contract
    if (to != get_self()) {
        return;
    }

    // check if the contract notifying us is a valid token contract
    const auto& token_symbol = quantity.symbol;
    stat_t stat_tbl(get_first_receiver(), token_symbol.code().raw());
    const auto& row = stat_tbl.find(token_symbol.code().raw());

    // abort if there was no token found
    if (row == stat_tbl.end()) {
        return;
    }

    // check valid memo
    check(memo == std::string("link"), "Invalid memo");

    // get the links table instance
    link_t link_tbl(get_self(), get_self().value);

    // find if the link exists
    // get the secondary index
    const auto& owner_idx = link_tbl.get_index<name("creator")>();

    size_t count = 0;
    bool found = false;
    uint64_t link_id = 0;

    // loop through all the links (limited to only 50 links)
    for (auto itr = owner_idx.find(from.value); itr != owner_idx.end() && ++count < 50; itr++) {
        // exit early if no link was found from this owner
        if (itr->creator != from) {
            break;
        }

        // skip links that have been funded
        if (itr->tokens_transferred) {
            continue;
        }

        // check if the link is from this sender, and with the same contract
        if (itr->creator == from && itr->token.contract == get_first_receiver() && itr->token.get_extended_symbol().get_symbol() == quantity.symbol) {
            found = true;
            link_id = itr->link_id;
            break;
        }
    }

    // check if a link was found
    check(found, "No announced link by this sender for this token exists");

    const auto& link_itr = link_tbl.find(link_id);

    // check if the transferred amount is sufficient
    check(quantity >= link_itr->token.quantity, "Insufficient quantity");

    link_tbl.modify(link_itr, same_payer, [&](link_s& row) {
        row.tokens_transferred = true;
    });

    // send back any excess tokens
    if (quantity > link_itr->token.quantity) {
        action(
            permission_level { get_self(), name("active") },
            get_first_receiver(), name("transfer"),
            make_tuple(
                get_self(),
                from,
                quantity - link_itr->token.quantity,
                string("claim link refund remaining tokens")))
            .send();
    }

    // log the link start
    action(
        permission_level { get_self(), name("active") },
        get_self(), name("loglinkstart"),
        make_tuple(link_id))
        .send();
}

ACTION gift_star::loglinkstart(const uint64_t& link_id)
{
    require_auth(get_self());

    // do nothing, this action is just for logging
}

ACTION gift_star::lognewlink(const uint64_t& link_id, const name& creator, const public_key& key, const extended_asset& token, const string& memo)
{
    require_auth(get_self());

    // do nothing, this action is just for logging
}
