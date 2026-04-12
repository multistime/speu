import type { Metadata } from "next";

import { MobileOAuthBridge } from "./MobileOAuthBridge";

export const metadata: Metadata = {
  title: "Уваход у праграму",
  robots: { index: false, follow: false },
};

export default function MobileOAuthCallbackPage() {
  return <MobileOAuthBridge />;
}
