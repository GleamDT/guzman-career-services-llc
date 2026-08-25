import { useEffect, useRef, useState } from 'react';

// Fires once when the element first scrolls into view, instead of the old
// approach of animating once on page mount — which finishes before most
// visitors ever scroll far enough to see it.
export function useInView(options) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15, rootMargin: '0px 0px -60px 0px', ...options }
        );

        observer.observe(el);
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally mount-only — this fires once per element, ever

    return [ref, inView];
}
