<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { API_NODE_URL, fetchLinkInfo } from "$lib";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import { Button } from "$lib/components/ui/button";
    import { Skeleton } from "$lib/components/ui/skeleton";
    import type { Types } from "$lib/contract";
    import { Contract as GiftStarContract } from "$lib/contract";
    import { login, session, transact } from "$lib/store";
    import { APIClient, Bytes, PrivateKey, PublicKey } from "@wharfkit/session";
    import { onMount } from "svelte";

    let linkId: number;
    let linkInfo: Types.link_s | undefined;
    let privKey: PrivateKey | undefined;
    let invalidLinkId = false;
    let invalidPrivateKey = false;
    let loadingLinkInfo = false;
    let alertOpen = false;

    function verifyPrivateKey(privKeyStr: string, publicKey?: PublicKey) {
        try {
            privKey = PrivateKey.fromString(privKeyStr);

            if (publicKey) {
                if (!privKey.toPublic().equals(publicKey)) {
                    throw new Error("mistamtched key");
                }
            }

            invalidPrivateKey = false;
        } catch (error) {
            invalidPrivateKey = true;
        }
    }

    async function claimLink() {
        if (!$session || !privKey) {
            return;
        }

        const giftStar = new GiftStarContract({
            client: new APIClient({ url: API_NODE_URL }),
        });

        const actions = [
            giftStar.action(
                "claimlink",
                {
                    link_id: linkId,
                    claimer: $session.actor,
                    claimer_signature: privKey.signMessage(Bytes.fromString($session.actor.toString(), "utf8")),
                },
                { authorization: [$session.permissionLevel] }
            ),
        ];

        try {
            alertOpen = false;
            await transact(actions);
            alertOpen = true;
        } catch (error) {
            console.error(error);
        }
    }

    onMount(async () => {
        const key = $page.url.searchParams.get("key");
        verifyPrivateKey(key!);

        linkId = parseInt($page.params.id!);

        if (isNaN(linkId) || linkId <= 0) {
            invalidLinkId = true;
        } else {
            loadingLinkInfo = true;
            linkInfo = await fetchLinkInfo(linkId);
            loadingLinkInfo = false;

            if (!linkInfo) {
                invalidLinkId = true;
            }

            verifyPrivateKey(key!, linkInfo?.key);
        }
    });
</script>

<section class="flex flex-col items-center justify-center py-2 sm:px-4">
    <AlertDialog.Root bind:open={alertOpen}>
        <AlertDialog.Content>
            <AlertDialog.Header>
                <AlertDialog.Title>Congratulations</AlertDialog.Title>
                <AlertDialog.Description>
                    <div class="flex flex-col gap-2">
                        <p class="rounded bg-green-700 p-2 text-center font-saira font-semibold text-white">Link claimed successfully</p>
                    </div>
                </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
                <AlertDialog.Action on:click={() => goto("/")}>Done</AlertDialog.Action>
            </AlertDialog.Footer>
        </AlertDialog.Content>
    </AlertDialog.Root>

    <div class="container flex max-w-screen-sm flex-col gap-8">
        {#if invalidLinkId}
            <p class="text-center font-saira font-medium text-destructive sm:text-lg lg:text-xl">Invalid link</p>
        {:else if loadingLinkInfo}
            <div class="flex flex-col gap-2 py-4">
                <Skeleton class="h-[32px] w-full" />
                <div class="flex flex-col gap-2">
                    <Skeleton class="h-[24px] w-full" />
                    <Skeleton class="h-[24px] w-full" />
                </div>
                <Skeleton class="my-4 h-[98px] w-full" />
                <div class="flex flex-col gap-2">
                    <Skeleton class="h-[24px] w-full" />
                </div>

                <div class="mt-4 flex flex-col gap-2">
                    <Skeleton class="h-[40px] w-full" />
                </div>
            </div>
        {:else}
            <div class="flex flex-col gap-2 py-4">
                <p class="text-center text-2xl font-bold sm:text-3xl lg:text-4xl">Claim Link #{linkId}</p>

                {#if invalidPrivateKey}
                    <div class="my-4 flex flex-col gap-2">
                        <p class="rounded bg-destructive p-2 text-center">You cannot claim this link because you did not use a valid key</p>
                    </div>
                {/if}
                {#if !linkInfo?.tokens_transferred}
                    <div class="my-4 flex flex-col gap-2">
                        <p class="rounded bg-destructive p-2 text-center">
                            You cannot claim this link because the owner has not transferred the tokens yet
                        </p>
                    </div>
                {/if}

                <div class="flex flex-col gap-2">
                    <div class="flex flex-row items-center gap-2">
                        <span class="font-semibold">Link ID</span>
                        <span>{linkInfo?.link_id}</span>
                    </div>
                    <div class="flex flex-row items-center gap-2">
                        <span class="font-semibold">Created By</span>
                        <a
                            target="_blank"
                            class="p-0 text-fuchsia-600"
                            rel="noreferrer"
                            href={`https://waxblock.io/account/${linkInfo?.creator.toString()}`}
                        >
                            {linkInfo?.creator}
                        </a>
                    </div>
                </div>

                <div class="my-4 flex flex-row items-center justify-center gap-2 rounded-xl border border-muted">
                    <p
                        class="bg-gradient-to-r from-cyan-600 to-fuchsia-600 bg-clip-text py-8 font-saira text-2xl font-bold text-transparent sm:text-3xl lg:text-4xl"
                    >
                        {linkInfo?.token?.quantity.value}
                        {linkInfo?.token?.quantity.symbol.code}
                    </p>
                </div>

                <div class="flex flex-col gap-2">
                    <div class="flex flex-row items-center gap-2">
                        <span class="font-semibold">Memo</span>
                        <span>{linkInfo?.memo}</span>
                    </div>
                </div>

                {#if $session}
                    {#if !invalidPrivateKey}
                        <div class="mt-4 flex flex-col gap-2 rounded-md bg-gradient-to-r from-cyan-600 to-fuchsia-600 p-[1px]">
                            <Button variant="ghost" class="bg-black hover:bg-transparent disabled:bg-black" on:click={claimLink}>Claim</Button>
                        </div>
                    {/if}
                {:else}
                    <div class="mt-4 flex flex-col items-center justify-center gap-2">
                        <Button on:click={login} variant="outline">Login</Button>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</section>
