"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type MobileDockSlotValue = {
  dockSlotEl: HTMLDivElement | null;
  setDockSlotEl: Dispatch<SetStateAction<HTMLDivElement | null>>;
};

const MobileDockSlotContext = createContext<MobileDockSlotValue | null>(null);

export function MobileDockSlotProvider({ children }: { children: ReactNode }) {
  const [dockSlotEl, setDockSlotEl] = useState<HTMLDivElement | null>(null);
  const value = useMemo(() => ({ dockSlotEl, setDockSlotEl }), [dockSlotEl]);
  return <MobileDockSlotContext.Provider value={value}>{children}</MobileDockSlotContext.Provider>;
}

export function useMobileDockSlot(): MobileDockSlotValue | null {
  return useContext(MobileDockSlotContext);
}
