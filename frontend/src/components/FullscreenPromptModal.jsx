import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Maximize2 } from 'lucide-react';

const FullscreenPromptModal = ({ isOpen, onEnterFullscreen, onClose }) => {
  if (!isOpen) return null;

  const handleEnterFullscreen = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
      onEnterFullscreen();
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <AlertTriangle className="h-12 w-12 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Fullscreen Required</CardTitle>
          <CardDescription>
            To ensure fair competition, this contest requires fullscreen mode.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Please enable fullscreen to continue with the contest.</p>
            <p className="mt-2">Code running and submission will be disabled until fullscreen is enabled.</p>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={handleEnterFullscreen}
              className="w-full"
              size="lg"
            >
              <Maximize2 className="h-5 w-5 mr-2" />
              Enter Fullscreen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FullscreenPromptModal;
