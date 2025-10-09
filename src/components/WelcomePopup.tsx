import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export const WelcomePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [hasShownForCurrentSession, setHasShownForCurrentSession] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading, updateUser } = useAuth();

  useEffect(() => {
    // Only show popup when user is authenticated and popup hasn't been shown before
    if (!loading && user && !hasShownForCurrentSession) {

      // Check if user has already dismissed the popup (from database via user object)
      const hasBeenDismissed = user?.welcome_popup_dismissed;
      
      if (!hasBeenDismissed) {
        // Small delay to ensure the page has loaded properly
        const timer = setTimeout(() => {
          setIsOpen(true);
          setHasShownForCurrentSession(true);
        }, 500);
        
        return () => clearTimeout(timer);
      } else {
      }
    }
  }, [user, loading, hasShownForCurrentSession]);

  const updateWelcomePopupPreference = async (dismissed: boolean) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3000/api/users/welcome-popup-dismissed', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ dismissed })
      });

      if (!response.ok) {
        throw new Error('Failed to update welcome popup preference');
      }
      
      // Update user object locally to prevent popup from showing again
      updateUser({ welcome_popup_dismissed: dismissed });
    } catch (error) {
      console.error('Error updating welcome popup preference:', error);
      // Fallback to localStorage if API fails
      localStorage.setItem('welcome-popup-dismissed', dismissed.toString());
    }
  };

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
    // Don't save to localStorage if user just clicks away/dismisses
    // This ensures the popup will show again next time
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