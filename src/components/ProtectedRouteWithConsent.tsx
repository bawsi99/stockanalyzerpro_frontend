import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ConsentModal from "@/components/ConsentModal";

interface ProtectedRouteWithConsentProps {
  children: React.ReactNode;
}

const ProtectedRouteWithConsent: React.FC<ProtectedRouteWithConsentProps> = ({ children }) => {
  const { user } = useAuth();
  const [showConsentModal, setShowConsentModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      // Check if user has seen consent modal
      const hasSeenConsentModal = localStorage.getItem("hasSeenConsentModal");
      const userConsentKey = `hasSeenConsentModal_${user.id}`;
      const userHasSeenConsent = localStorage.getItem(userConsentKey);

      // Show modal if user hasn't seen it (check both general and user-specific keys)
      if (!hasSeenConsentModal && !userHasSeenConsent) {
        setShowConsentModal(true);
      }
    }
  }, [user?.id]);

  const handleAccept = () => {
    if (user?.id) {
      // Set both general and user-specific consent
      localStorage.setItem("hasSeenConsentModal", "true");
      localStorage.setItem(`hasSeenConsentModal_${user.id}`, "true");
    }
    setShowConsentModal(false);
  };

  return (
    <>
      <ProtectedRoute>{children}</ProtectedRoute>
      {user && (
        <ConsentModal open={showConsentModal} onAccept={handleAccept} />
      )}
    </>
  );
};

export default ProtectedRouteWithConsent;

