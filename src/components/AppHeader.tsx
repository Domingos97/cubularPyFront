import { Download, Menu, FileText, Table, Plus, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { X } from 'lucide-react';
import { useNavigate, useLocation } from "react-router-dom";
import UserNotificationsBell from "@/components/notifications/UserNotificationsBell";
import { useAuth } from "@/hooks/useAuth";
interface AppHeaderProps {
  searchTerm?: string;
  currentTab?: "stats" | "responses" | "chat";
  onResetSearch?: () => void;
  onExportPDF?: () => void;
  onExportCSV?: () => void;
  onToggleSidebar?: () => void;
  onNewChat?: () => void;
}
const AppHeader = ({
  searchTerm = "holiday",
  currentTab,
  onResetSearch,
  onExportPDF,
  onExportCSV,
  onToggleSidebar,
  onNewChat
}: AppHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const handleResetSearch = () => {
    if (onResetSearch) {
      onResetSearch();
    } else {
      navigate('/', {
        state: {
          resetSearch: true
        }
      });
    }
  };
  const navigateToHome = () => {
    navigate('/', {
      state: {
        resetSearch: true
      }
    });
  };
  return (
    <div className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800/60">
        {/* Header container with consistent padding and spacing */}
        <div className="flex flex-col">
          {/* First frame - search term */}
          <div className="h-[50px] px-3 md:px-6">
            <div className="h-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 rounded-full text-gray-400 hover:text-white" onClick={onToggleSidebar}>
                  <Menu className="h-5 w-5" />
                </Button>
                <h2 className="text-2xl font-grotesk font-semibold text-white pb-0.5 translate-y-[2px]">"{searchTerm}"</h2>
              </div>
              
              {/* Right side with notification bell and Cubular logo */}
              <div className="flex items-center gap-2">
                {/* User Notifications Bell - Show for all logged-in users */}
                {user && (
                  <UserNotificationsBell />
                )}
                
                {/* Cubular logo */}
                <Button variant="ghost" className="h-8 p-1 rounded-md text-blue-500 hover:bg-gray-800 transition-colors" onClick={navigateToHome}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-100">CUBULAR</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Second frame - respondent count and action buttons */}
          <div className="h-[50px] px-3 md:px-6">
            <div className="h-full flex items-center justify-between">
              {/* Removed search icon and its button */}
              
              <div className="flex items-center gap-2">
                {/* New Chat Button - only show on chat tab */}
                {currentTab === "chat" && onNewChat && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    onClick={onNewChat}
                    aria-label="Start new chat with file selection"
                  >
                    <Plus className="h-4 w-4" />
                    <MessageCircle className="h-4 w-4" />
                    New Chat
                  </Button>
                )}
                
                {/* Export Button - only show on responses tab */}
                {currentTab === "responses" && onExportPDF && onExportCSV && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex items-center gap-2"
                        aria-label="Export targeting data"
                      >
                        <Download className="h-4 w-4" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-48 bg-gray-900 border-gray-700 z-50 text-white"
                      aria-label="Export options"
                    >
                      <DropdownMenuItem 
                        onClick={onExportPDF}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 text-gray-200 focus:bg-gray-800 focus:text-white"
                        aria-label="Export as PDF"
                      >
                        <FileText className="h-4 w-4" />
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={onExportCSV}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 text-gray-200 focus:bg-gray-800 focus:text-white"
                        aria-label="Export as CSV"
                      >
                        <Table className="h-4 w-4" />
                        Export as CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
          {/* Tabs row under the search bar (desktop/tablet) - Removed obsolete tabs */}
          {/* IconTabs component removed as these tabs are no longer needed */}
        </div>
      </div>
  );
};
export default AppHeader;