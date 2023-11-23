<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { login, session } from "$lib/store";
</script>

<section class="flex flex-col items-center justify-center px-4">
    <p
        class="bg-gradient-to-r from-cyan-600 to-fuchsia-600 bg-clip-text py-8 font-saira text-5xl font-bold text-transparent sm:text-6xl lg:text-8xl"
    >
        Gift.Star
    </p>

    <p class="text-center font-saira font-medium sm:text-lg lg:text-xl">Create, share & claim token gifts with your friends</p>

    <div class="mt-16 flex flex-row gap-4">
        {#if $session}
            <Button href="/trading/create" variant="secondary">Create Link</Button>
            <Button href="/trading/links" variant="secondary">My Links</Button>
        {:else}
            <Button on:click={login} variant="outline">Login</Button>
        {/if}
    </div>
</section>
