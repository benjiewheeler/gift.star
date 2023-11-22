# gift.star

Smart contract for creating secure claim links for fungible tokens on the WAX blockchain.

This contract is inspired by the [atomictoolsx](https://waxblock.io/account/atomictoolsx) contract.

## Features

-   create secure token claim links for any token that follows the [eosio.token](https://github.com/AntelopeIO/reference-contracts/blob/main/contracts/eosio.token) standard
-   links cancelable only by the original creator, but claimable by anyone with corresponding private key

## Building

This repo uses [Bun](https://bun.sh/) for running tasks and testing, (can be replaced with [Yarn](https://yarnpkg.com/))

## Testing

The contract is fully tested using proton's [VeRT](https://docs.protonchain.com/contract-sdk/testing.html)

-   [blanc](https://github.com/haderech/blanc) is required for building the contract for testing.

```bash
bun install # or yarn or pnpm
bun run build:dev # to compile the contract using blanc++
bun test
```

## Deployment

-   Antelope [cdt](https://github.com/AntelopeIO/cdt) and [leap](https://github.com/AntelopeIO/leap) are required for building & deploying the contract.

```bash
bun run build:prod # to compile the contract using cdt-cpp

# deploy the contract
cleos -u <your_api_endpoint> set contract <account> $PWD contract/gift_star.wasm contract/gift_star.abi -p <account>@active

# dont forget to add eosio.code permission
cleos -u <your_api_endpoint> set account permission <account> active --add-code
```

## Want more features ?

_Hire me_ ;)

[![Discord Badge](https://img.shields.io/static/v1?message=Discord&label=benjie_wh&style=flat&logo=discord&color=7289da&logoColor=7289da)](https://discordapp.com/users/789556474002014219)
[![Telegram Badge](https://img.shields.io/static/v1?message=Telegram&label=benjie_wh&style=flat&logo=telegram&color=229ED9)](https://t.me/benjie_wh)
[![Protonmail Badge](https://img.shields.io/static/v1?message=Email&label=ProtonMail&style=flat&logo=protonmail&color=6d4aff&logoColor=white)](mailto:benjiewheeler@protonmail.com)
[![Github Badge](https://img.shields.io/static/v1?message=Github&label=benjiewheeler&style=flat&logo=github&color=171515)](https://github.com/benjiewheeler)
