<script>
    import { page } from '$app/stores';
</script>

<header class="fixed w-full bg-white top-0 p-4 shadow">
    <nav>
        <ul class="flex flex-col lg:flex-row list-none lg:ml-auto">
            <li aria-current={$page.url.pathname === '/' ? 'page' : undefined}>
                <a href="/">Home</a>
            </li>
        </ul>
    </nav>
</header>
<section class="mt-16"></section>
