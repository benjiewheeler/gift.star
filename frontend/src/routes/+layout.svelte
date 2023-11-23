<script lang="ts">
    import Button from "$lib/components/ui/button/button.svelte";
    import { logout, restoreSession, session } from "$lib/store";
    import { onMount } from "svelte";
    import "../app.pcss";

    onMount(async () => {
        await restoreSession();
    });
</script>

<svelte:head>
    <title>Gift.Star - Create & share secure token gifts with your friends</title>
    <meta name="description" content="Create & share secure token gifts with your friends" />

    <link rel="author" href="https://github.com/benjiewheeler" />
    <meta name="author" content="Benjie" />

    <meta name="keywords" content="antelope,wax,token,claim,link,gift,star" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Saira:wght@300;400;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<main class="relative flex min-h-screen flex-col font-saira dark:bg-black dark:text-white/90">
    <header
        class="border-orange sticky top-0 z-50 w-full border-b border-b-neutral-600 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
        <div class="container mx-auto flex h-14 items-center justify-between px-4">
            <a href="/" class="text-lg font-bold">gift.star</a>

            <div class="flex items-center gap-2">
                {#if $session}
                    <p class="font-saira">{$session.actor}</p>
                    <Button size="sm" on:click={logout} variant="outline">Logout</Button>
                {/if}
            </div>
        </div>
    </header>

    <slot />

    <footer class="mt-14">
        <div
            class="absolute bottom-0 flex h-14 w-full items-center justify-center border-t border-t-neutral-600 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
            <div class="container mx-auto flex items-center justify-between px-4">
                <a href="/" class="text-lg font-bold">gift.star</a>

                <span class="text-sm">
                    Source available on <a
                        href="https://github.com/benjiewheeler/gift.star"
                        target="_blank"
                        rel="noreferrer"
                        class="font-semibold"
                    >
                        GitHub
                    </a>
                </span>
            </div>
        </div>
    </footer>
</main>
