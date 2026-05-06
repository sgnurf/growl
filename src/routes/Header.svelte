<script>
    import { page } from '$app/state';

    const navLinks = [
        { href: '/', label: 'Projects' },
        { href: '/templates', label: 'Templates' }
    ];
</script>

<header class="fixed w-full bg-white top-0 p-4 shadow z-10">
    <nav>
        <ul class="flex flex-row gap-6 list-none items-center">
            <li class="font-bold text-lg mr-4">Growl</li>
            {#each navLinks as link}
                <li aria-current={page.url.pathname === link.href ? 'page' : undefined}>
                    <a
                        href={link.href}
                        class="text-gray-600 hover:text-black transition-colors"
                        class:font-semibold={page.url.pathname === link.href}>{link.label}</a
                    >
                </li>
            {/each}
        </ul>
    </nav>
</header>
<section class="mt-16"></section>
