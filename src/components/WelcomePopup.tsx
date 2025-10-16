import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { buildApiUrl, API_CONFIG } from '@/config';

export const WelcomePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [hasShownForCurrentSession, setHasShownForCurrentSession] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading, updateUser } = useAuth();

  // Debug: Add a way to reset the popup for testing (remove in production)
  useEffect(() => {
    // Check if we're in development and there's a reset flag
    const shouldReset = new URLSearchParams(window.location.search).get('resetWelcome');
    if (shouldReset === 'true') {
      updateUser({ welcome_popup_dismissed: false });
      console.log('Welcome popup state reset for testing');
    }
  }, [updateUser]);

  const updateWelcomePopupPreference = async (dismissed: boolean) => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        console.warn('No auth token found, cannot update preference');
        return;
      }
      
      // First test if auth is working by calling a known working endpoint
      console.log('Testing authentication with /api/users/me/language...');
      const testResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.USERS.LANGUAGE), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!testResponse.ok) {
        console.error('Auth test failed:', testResponse.status, testResponse.statusText);
        return;
      }
      
      console.log('Auth test successful, attempting welcome popup update...');
      
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.USERS.WELCOME_POPUP_DISMISSED), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ dismissed })
      });

      if (response.status === 401 || response.status === 403) {
        console.warn('Authentication failed for welcome popup endpoint:', response.status);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, response.statusText, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('Successfully updated welcome popup preference via API');
      
      // Update local user object immediately to reflect the change
      // This ensures the popup won't show again in this session
      updateUser({ welcome_popup_dismissed: dismissed });
      
      // Note: We don't force a token refresh here because:
      // 1. The change is already saved to the database
      // 2. The local user state is updated to prevent popup from showing again
      // 3. The next time a token is naturally refreshed (during normal API calls), 
      //    it will contain the updated welcome_popup_dismissed value
      // 4. Forcing an immediate refresh can cause auth issues if the refresh fails
      console.log('Welcome popup preference updated successfully. Token will be updated on next natural refresh.');
    } catch (error) {
      console.error('Error updating welcome popup preference:', error);
      // No localStorage fallback - if API fails, preference won't be saved
    }
  };

  useEffect(() => {
    // Only show popup when user is authenticated
    if (!loading && user) {
      // Check if user has already dismissed the popup from database (via JWT token)
      const hasBeenDismissed = user?.welcome_popup_dismissed;
      
      console.log('Welcome Popup Debug:', {
        loading,
        user: !!user,
        userEmail: user?.email,
        hasShownForCurrentSession,
        hasBeenDismissed,
        userWelcomePopupDismissed: user?.welcome_popup_dismissed,
        decision: hasBeenDismissed ? 'Dismissed in database' : 'Not dismissed - will show'
      });
      
      if (!hasBeenDismissed && !hasShownForCurrentSession) {
        console.log('Showing welcome popup...');
        // Small delay to ensure the page has loaded properly
        const timer = setTimeout(() => {
          setIsOpen(true);
          setHasShownForCurrentSession(true);
        }, 500);
        
        return () => clearTimeout(timer);
      } else {
        console.log('Welcome popup not shown because:', {
          hasBeenDismissed,
          hasShownForCurrentSession,
          reason: hasBeenDismissed ? 'dismissed in database' : 'already shown this session'
        });
      }
    } else {
      console.log('Welcome popup conditions not met:', { loading, user: !!user });
    }
  }, [user, loading, hasShownForCurrentSession]);

  const handleClose = async () => {
    if (dontShowAgain) {
      setIsLoading(true);
      await updateWelcomePopupPreference(true);
      setIsLoading(false);
    }
    setIsOpen(false);
  };

  const handleDismiss = () => {
    setIsOpen(false);
    // Just close the popup without saving preference
    // This means the popup might show again in future sessions
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-2xl font-bold text-center">
            Bem-vindo à Nossa Aplicação!
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-base leading-relaxed space-y-4">
              <p>
                Esta aplicação foi desenvolvida para proporcionar uma experiência única e personalizada na análise de dados e insights. 
                Com funcionalidades avançadas de inteligência artificial e uma interface intuitiva, você poderá explorar informações 
                de forma eficiente e tomar decisões mais informadas.
              </p>
              <p>
                Navegue pelas diferentes seções para descobrir todas as funcionalidades disponíveis, desde a análise de surveys até 
                a configuração de personalidades de IA personalizadas. Nossa plataforma está aqui para simplificar seu trabalho e 
                maximizar seus resultados.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 mt-6">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="dont-show-again" 
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
            />
            <label 
              htmlFor="dont-show-again" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Não mostrar novamente
            </label>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleDismiss}>
              Fechar
            </Button>
            <Button onClick={handleClose} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Continuar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
