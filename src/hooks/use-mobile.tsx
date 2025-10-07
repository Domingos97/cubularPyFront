
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  )
  const [width, setWidth] = React.useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 0
  )

  React.useEffect(() => {
    const checkMobile = () => {
      const windowWidth = window.innerWidth;
      setIsMobile(windowWidth < MOBILE_BREAKPOINT);
      setWidth(windowWidth);
    }
    
    // Initial check
    checkMobile()
    
    // Set up event listener for resize with debounce for performance
    let timeoutId: number | null = null;
    const handleResize = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(checkMobile, 100);
    };
    
    window.addEventListener("resize", handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }, [])

  // Return both the boolean and the object for backward compatibility
  return Object.assign(isMobile, { isMobile, width })
}
