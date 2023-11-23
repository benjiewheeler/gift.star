<script lang="ts">
    import { API_NODE_URL, fetchUserLinks, waitFor } from "$lib";
    import { Button } from "$lib/components/ui/button";
    import { Skeleton } from "$lib/components/ui/skeleton";
    import type { Types } from "$lib/contract";
    import { Contract as GiftStarContract } from "$lib/contract";
    import { session, transact } from "$lib/store";
    import type { UInt64Type } from "@wharfkit/session";
    import { APIClient } from "@wharfkit/session";

    let links: Types.link_s[] | undefined;
    let loadingLinks = false;

    session.subscribe(async session => {
        if (session) {
            loadUserLinks();
        }
    });

    async function loadUserLinks() {
        loadingLinks = true;
        links = await fetchUserLinks($session?.actor!);
        loadingLinks = false;
    }

    async function cancelLink(linkId: UInt64Type) {
        if (!$session) {
            return;
        }

        const giftStar = new GiftStarContract({
            client: new APIClient({ url: API_NODE_URL }),
        });

        const actions = [giftStar.action("cancellink", { link_id: linkId }, { authorization: [$session.permissionLevel] })];

        try {
            await transact(actions);
            loadingLinks = true;
            await waitFor(2e3);

            loadUserLinks();
        } catch (error) {
            console.error(error);
        }
    }
</script>

<section class="flex flex-col items-center justify-center py-2 sm:px-4">
    <div class="container flex max-w-screen-sm flex-col gap-8">
        {#if loadingLinks}
            <div class="flex flex-col gap-2 py-4">
                {#each { length: 7 } as _}
                    <div class="flex flex-row items-center justify-between gap-2 rounded-md border border-muted p-2">
                        <div class="flex flex-1 flex-col justify-between gap-1">
                            <Skeleton class="h-[20px] w-[96px]" />
                            <Skeleton class="h-[20px] w-[96px]" />
                        </div>
                        <Skeleton class="h-[36px] w-[64px]" />
                    </div>
                {/each}
            </div>
        {:else if links}
            <div class="flex flex-col gap-2 py-4">
                <div class="flex flex-col gap-2">
                    {#if links.length > 0}
                        {#each links as link}
                            <div class="flex flex-row items-center justify-between gap-2 rounded-md border border-muted p-2">
                                <div class="flex flex-1 flex-col justify-between">
                                    <a class="font-bold text-cyan-600 hover:underline" href={`/trading/link/${link.link_id}`}>
                                        Link ID #{link.link_id}
                                    </a>
                                    <span class="text-sm">{link.token?.quantity.value} {link.token?.quantity.symbol.code}</span>
                                    <span class="break-all text-sm">{link.memo}</span>
                                </div>
                                <Button on:click={() => cancelLink(link.link_id)} size="sm" variant="destructive">Cancel</Button>
                            </div>
                        {/each}
                    {:else}
                        <div class="my-4 flex flex-col gap-2">
                            <p class="p-2 text-center">No links found</p>
                            <p class="p-2 text-center">
                                Click <a class="text-cyan-600 underline" href="/trading/create">here</a>
                                to create one
                            </p>
                        </div>
                    {/if}
                </div>
            </div>
        {:else}
            <div class="my-4 flex flex-col gap-2">
                <p class="rounded bg-destructive p-2 text-center">No links found</p>
            </div>
        {/if}
    </div>
</section>
