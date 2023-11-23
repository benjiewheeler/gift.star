<script lang="ts">
    import { API_NODE_URL, fetchBalances, fetchLinkId, waitFor } from "$lib";
    import { Button } from "$lib/components/ui/button";
    import * as Command from "$lib/components/ui/command";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Input } from "$lib/components/ui/input";
    import * as Popover from "$lib/components/ui/popover";
    import { Skeleton } from "$lib/components/ui/skeleton";
    import { Contract as GiftStarContract } from "$lib/contract";
    import { balances, session, transact } from "$lib/store";
    import { cn } from "$lib/utils";
    import { APIClient, Asset, KeyType, PrivateKey } from "@wharfkit/session";
    import { Check, ChevronsUpDown } from "lucide-svelte";
    import { tick } from "svelte";

    let tokenAmount = "0";
    let memo = "";
    let privKey: PrivateKey;
    let generatedLinkId: string | undefined;

    let shareLinkDialogOpen = false;

    let tokenPickerOpen = false;
    let selectedToken: LightAPI.TokenBalance;
    let selectedValue: string;
    $: {
        const token = $balances.find(f => f === selectedToken);
        selectedValue = formatToken(token) ?? "Select a token...";
    }

    // We want to refocus the trigger button when the user selects
    // an item from the list so users can continue navigating the
    // rest of the form with the keyboard.
    function closeAndFocusTrigger(triggerId: string) {
        tokenPickerOpen = false;
        tick().then(() => {
            document.getElementById(triggerId)?.focus();
        });
    }

    session.subscribe(session => {
        if (session) {
            fetchBalances(session.actor.toString()).then(list => balances.set(list.filter(b => Number(b.amount) > 0)));
        }
    });

    const formatToken = (token: LightAPI.TokenBalance | undefined) => {
        if (!token) return undefined;
        return `${token.decimals},${token.currency}@${token.contract}`;
    };

    async function createLink() {
        if (!$session) {
            return;
        }

        if (isNaN(parseFloat(tokenAmount)) || parseFloat(tokenAmount) <= 0) {
            return;
        }

        privKey = PrivateKey.generate(KeyType.K1);

        const quantity = Asset.from(Number(tokenAmount), Asset.Symbol.from(`${selectedToken.decimals},${selectedToken.currency}`));

        const giftStar = new GiftStarContract({
            client: new APIClient({ url: API_NODE_URL }),
        });

        const actions = [
            giftStar.action(
                "announcelink",
                {
                    creator: $session.actor,
                    key: privKey.toPublic().toLegacyString(),
                    token: { contract: selectedToken.contract, quantity },
                    memo: memo ?? "",
                },
                { authorization: [$session.permissionLevel] }
            ),
            {
                account: selectedToken.contract,
                name: "transfer",
                authorization: [$session.permissionLevel],
                data: { from: $session.actor, to: giftStar.account, quantity, memo: "link" },
            },
        ];

        try {
            generatedLinkId = undefined;
            const { resolved } = await transact(actions);
            shareLinkDialogOpen = true;

            const id = resolved?.transaction.id!;
            while (!generatedLinkId) {
                await waitFor(2e3);
                generatedLinkId = await fetchLinkId(id?.hexString);
            }

            await fetchBalances($session.actor.toString()).then(list => balances.set(list.filter(b => Number(b.amount) > 0)));
        } catch (error) {
            console.error(error);
        }
    }

    function generateShareLink() {
        const url = new URL(`/trading/link/${generatedLinkId}`, location.href);
        url.searchParams.set("key", privKey.toWif());

        return url.toString();
    }

    function closeLinkDialog() {
        navigator.clipboard.writeText(generateShareLink());
        shareLinkDialogOpen = false;
    }
</script>

<section class="flex flex-col items-center justify-center px-4 py-2">
    <Dialog.Root bind:open={shareLinkDialogOpen}>
        <Dialog.Content class="max-w-screen-sm">
            <Dialog.Header>
                <Dialog.Title class="mb-4">
                    {#if !generatedLinkId}
                        Waiting for blockchain confirmation
                    {:else}
                        Link created successfully
                    {/if}
                </Dialog.Title>
                <Dialog.Description>
                    {#if !generatedLinkId}
                        <Skeleton class="h-[56px] w-full p-2" />
                    {:else}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                        <p
                            on:click={() => navigator.clipboard.writeText(generateShareLink())}
                            class="select-all break-all rounded bg-muted p-2 font-saira selection:bg-primary/20 selection:text-primary"
                        >
                            {generateShareLink()}
                        </p>
                        <p class="select-none py-1 font-saira leading-tight text-yellow-500/80">
                            Make sure to copy the link above, you will not be able to see it again
                        </p>
                    {/if}
                </Dialog.Description>

                <Dialog.Footer>
                    <Button type="submit" variant="outline" on:click={closeLinkDialog}>Copy</Button>
                </Dialog.Footer>
            </Dialog.Header>
        </Dialog.Content>
    </Dialog.Root>

    <div class="container flex max-w-screen-sm flex-col gap-8">
        <div class="flex flex-col gap-2">
            <p>1. Select a token</p>
            <Popover.Root bind:open={tokenPickerOpen} let:ids>
                <Popover.Trigger asChild let:builder>
                    <Button
                        builders={[builder]}
                        variant="outline"
                        role="combobox"
                        aria-expanded={tokenPickerOpen}
                        class="w-[200px] justify-between"
                    >
                        {selectedToken?.currency ?? "Select a token..."}
                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </Popover.Trigger>
                <Popover.Content class="w-[200px] p-0">
                    <Command.Root>
                        <Command.Input placeholder="Search token..." />
                        <Command.Empty>No tokens found.</Command.Empty>
                        <Command.Group>
                            {#each $balances as balance}
                                <Command.Item
                                    value={`${balance.decimals},${balance.currency}@${balance.contract}`}
                                    onSelect={() => {
                                        selectedToken = balance;
                                        closeAndFocusTrigger(ids.trigger);
                                    }}
                                >
                                    <Check class={cn("mr-2 h-4 w-4", selectedValue !== formatToken(balance) && "text-transparent")} />
                                    <span class="font-saira">
                                        {balance.currency}
                                        ({balance.contract})
                                    </span>
                                </Command.Item>
                            {/each}
                        </Command.Group>
                    </Command.Root>
                </Popover.Content>
            </Popover.Root>
        </div>

        <div class="flex flex-col gap-2">
            <p>2. Input the amount you want</p>

            <div class="flex w-full max-w-sm flex-col gap-1.5">
                <Input disabled={!selectedToken} type="number" min={0} bind:value={tokenAmount} max={selectedToken?.amount ?? 100} />

                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                <p class="cursor-pointer text-sm text-muted-foreground" on:click={() => (tokenAmount = selectedToken?.amount ?? "0")}>
                    {selectedToken ? `${selectedToken?.amount} ${selectedToken?.currency}` : ""}
                </p>
            </div>
        </div>

        <div class="flex flex-col gap-2">
            <p>3. Input the memo you want</p>

            <div class="flex w-full max-w-sm flex-col gap-1.5">
                <Input disabled={!selectedToken || !tokenAmount || !Number(tokenAmount)} type="text" maxlength={256} bind:value={memo} />
            </div>
        </div>

        <div class="flex flex-col items-start gap-2">
            <p>4. Create the link</p>

            <Button variant="outline" disabled={!selectedToken || !tokenAmount || !Number(tokenAmount)} on:click={createLink}>Create</Button>
        </div>
    </div>
</section>
