"use client";

import { type RefObject, useLayoutEffect } from "react";

/** Вышыня `SpeuBottomNav` (уключна safe-area пад ніз), px — для `bottom` дак-плэера */
export const SPEU_CSS_VAR_TAB_BAR = "--speu-mobile-tab-bar-height";

/** Вышыня мабільнага дака `GlobalPlayer` (прагрэс + бар), px */
export const SPEU_CSS_VAR_MINI_PLAYER = "--speu-mobile-mini-player-height";

const MOBILE_MQ = "(max-width: 767px)";

function applyTabBarPx(el: HTMLElement) {
  const h = Math.max(0, Math.ceil(el.getBoundingClientRect().height));
  document.documentElement.style.setProperty(SPEU_CSS_VAR_TAB_BAR, `${h}px`);
}

/** Сінхранізацыя высакароднай мяжы таб-бара з CSS (ResizeObserver + visualViewport/orientation). */
export function useSyncSpeuTabBarHeight(
  elementRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useLayoutEffect(() => {
    if (!enabled) {
      document.documentElement.style.removeProperty(SPEU_CSS_VAR_TAB_BAR);
      return;
    }

    const el = elementRef.current;
    if (!el) return;

    const apply = () => applyTabBarPx(el);

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.visualViewport?.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);

    return () => {
      ro.disconnect();
      window.visualViewport?.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
      document.documentElement.style.removeProperty(SPEU_CSS_VAR_TAB_BAR);
    };
  }, [enabled, elementRef]);
}

/** Вышыня дак-плэера ў вузкім акне; на md+ шкодуе → 0. */
export function useSyncSpeuMiniPlayerHeight(
  elementRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
) {
  useLayoutEffect(() => {
    if (!enabled) {
      document.documentElement.style.setProperty(SPEU_CSS_VAR_MINI_PLAYER, "0px");
      return;
    }

    const el = elementRef.current;
    if (!el) return;

    const apply = () => {
      if (!window.matchMedia(MOBILE_MQ).matches) {
        document.documentElement.style.setProperty(SPEU_CSS_VAR_MINI_PLAYER, "0px");
        return;
      }
      const h = Math.max(0, Math.ceil(el.getBoundingClientRect().height));
      document.documentElement.style.setProperty(SPEU_CSS_VAR_MINI_PLAYER, `${h}px`);
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    const mq = window.matchMedia(MOBILE_MQ);
    mq.addEventListener("change", apply);
    window.visualViewport?.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);

    return () => {
      ro.disconnect();
      mq.removeEventListener("change", apply);
      window.visualViewport?.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
      document.documentElement.style.setProperty(SPEU_CSS_VAR_MINI_PLAYER, "0px");
    };
  }, [enabled, elementRef]);
}
