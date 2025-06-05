
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Default to false (desktop) for SSR and initial client render.
  // The actual value will be set on the client after the component mounts.
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    // This effect runs only on the client.
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const checkMobileStatus = () => {
      setIsMobile(mql.matches);
    };

    checkMobileStatus(); // Check status on initial client mount

    mql.addEventListener("change", checkMobileStatus);
    
    return () => {
      mql.removeEventListener("change", checkMobileStatus);
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

  return isMobile;
}
