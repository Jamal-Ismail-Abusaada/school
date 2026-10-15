(() => {
    'use strict';

    const menu = document.querySelector('.navbar-collapse');
    const toggle = document.querySelector('.menu-toggle');
    const navbar = document.querySelector('.navbar');
    const mobile = window.matchMedia('(max-width: 1050px)');
    const links = [...menu.querySelectorAll('.nav-link')];
    const sections = links.map(link => document.querySelector(link.hash));

    function setMenu(open, restoreFocus = false) {
        toggle.setAttribute('aria-expanded', String(open));
        toggle.querySelector('.menu-icon').textContent = open ? '×' : '☰';
        toggle.querySelector('.menu-label').textContent = open ? 'إغلاق' : 'القائمة';
        menu.hidden = mobile.matches && !open;
        if (restoreFocus) toggle.focus();
    }

    function syncMenu() {
        const active = document.activeElement;
        toggle.hidden = !mobile.matches;
        setMenu(false);
        if (mobile.matches && menu.contains(active)) toggle.focus();
        if (!mobile.matches && active === toggle) navbar.querySelector('.navbar-brand').focus();
    }

    toggle.addEventListener('click', () => {
        setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    mobile.addEventListener('change', syncMenu);
    syncMenu();
    navbar.dataset.enhanced = '';
    function updateNavHeight() {
        document.documentElement.style.setProperty('--nav-height', `${navbar.offsetHeight}px`);
    }
    updateNavHeight();
    if ('ResizeObserver' in window) new ResizeObserver(updateNavHeight).observe(navbar);
    else window.addEventListener('resize', updateNavHeight, { passive: true });

    // Keep native anchor navigation, browser history and keyboard behavior.
    links.forEach(link => {
        link.addEventListener('click', () => {
            if (!mobile.matches) return;
            const target = document.querySelector(link.hash);
            setMenu(false);
            target.tabIndex = -1;
            target.focus({ preventScroll: true });
        });
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && mobile.matches && !menu.hidden) {
            setMenu(false, true);
        }
    });
    document.addEventListener('click', event => {
        if (mobile.matches && !menu.hidden && !navbar.contains(event.target)) {
            const restoreFocus = menu.contains(document.activeElement);
            setMenu(false, restoreFocus);
        }
    });

    function markCurrent(id) {
        links.forEach(link => {
            if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
    }
    markCurrent(sections.find(section => `#${section.id}` === location.hash)?.id || 'home');

    if ('IntersectionObserver' in window) {
        // Observe a narrow band near the viewport's top, even for tall sections.
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) markCurrent(entry.target.id);
            });
        }, { rootMargin: '-10% 0px -65% 0px', threshold: 0 });
        sections.forEach(section => observer.observe(section));

        const backToTop = document.querySelector('.back-to-top');
        let heroVisible = true;
        backToTop.addEventListener('blur', () => {
            if (heroVisible) backToTop.hidden = true;
        });
        const heroObserver = new IntersectionObserver(([entry]) => {
            heroVisible = entry.isIntersecting;
            // Do not remove a focused control while a keyboard user is using it.
            backToTop.hidden = heroVisible && document.activeElement !== backToTop;
        });
        heroObserver.observe(document.querySelector('.hero'));
    }
})();
