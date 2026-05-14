"use client";

// =====================================================================
// AutoQuote — Shell de /analytics
// Mesmo padrão visual do Dashboard: Sidebar fixa + main com ml-[220px].
// =====================================================================
import { useState } from "react";
import AnalyticsContent from "./analytics/AnalyticsContent";
import SettingsModal from "./SettingsModal";
import Sidebar from "./Sidebar";

type Props = { userEmail: string; userId: string };

export default function AnalyticsView({ userEmail, userId }: Props) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-bone dark:bg-carbon text-carbon dark:text-bone">
      <Sidebar
        userEmail={userEmail}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className="ml-[220px] min-h-screen px-10 py-10">
        <AnalyticsContent userId={userId} />
      </main>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userId={userId}
      />
    </div>
  );
}
