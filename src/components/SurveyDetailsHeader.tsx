import { ArrowLeft, Download, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "@/resources/i18n";
// import { useAuth } from "@/hooks/useAuth";

import React from "react";
interface SurveyDetailsHeaderProps {
  surveyTitle: string;
  onExport?: () => void;
  rightContent?: React.ReactNode;
}

const SurveyDetailsHeader = ({
  surveyTitle,
  onExport,
  rightContent
}: SurveyDetailsHeaderProps) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useTranslation();


  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navigateToAdmin = () => {
    navigate('/admin');
  };

  return (
    <div className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800/60">
      <div className="flex flex-col">
        {/* Header with survey title and navigation */}
        <div className="h-[50px] px-3 md:px-6">
          <div className="h-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 p-0 rounded-full text-gray-400 hover:text-white" 
                onClick={toggleSidebar}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-2xl font-grotesk font-semibold text-white pb-0.5 translate-y-[2px]">
                {t('common.surveyDetails')}: {surveyTitle}
              </h2>
            </div>
            {/* Back to Admin button */}
            <Button 
              variant="ghost" 
              className="h-8 px-3 rounded-md text-blue-500 hover:bg-gray-800 transition-colors" 
              onClick={navigateToAdmin}
            >
              <div className="flex items-center gap-1.5">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-medium text-gray-100">ADMIN</span>
              </div>
            </Button>
          </div>
        </div>
        {/* Action buttons */}
        <div className="h-[50px] px-3 md:px-6">
          <div className="h-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                onClick={navigateToAdmin}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {onExport && (
                <Button 
                  onClick={onExport}
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              )}
              {rightContent && (
                <div className="ml-2 flex items-center">{rightContent}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyDetailsHeader;