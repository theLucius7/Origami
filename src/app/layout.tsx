import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_JP, Noto_Sans_SC, Noto_Sans_TC } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/providers/toast-provider";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { getRequestLocale } from "@/i18n/locale.server";
import { getMessages } from "@/i18n/messages";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-noto-sans-sc",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  variable: "--font-noto-sans-tc",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
  weight: ["400", "500", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);

  return {
    title: "Origami",
    description: messages.metadata.description,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale}>
      <body
        className={[
          inter.variable,
          jetbrainsMono.variable,
          notoSansSC.variable,
          notoSansTC.variable,
          notoSansJP.variable,
          "antialiased",
        ].join(" ")}
      >
        <I18nProvider locale={locale}>
          <TooltipProvider delayDuration={0}>
            <ToastProvider>{children}</ToastProvider>
          </TooltipProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
