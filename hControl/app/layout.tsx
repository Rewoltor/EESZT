import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "EESZT Medical History Analyzer",
    description: "Analyze your Hungarian medical history with AI-powered insights. Upload PDFs, visualize blood test results, and chat with your medical data.",
    keywords: ["EESZT", "medical history", "blood tests", "health analytics", "Hungary"],
};

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="hu" suppressHydrationWarning>
            <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
                <ThemeProvider>
                    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
                        <Header />
                        {/* Page Content */}
                        <div className="flex-1 flex flex-col">
                            {children}
                        </div>
                        <Footer />
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}
