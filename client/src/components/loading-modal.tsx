import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";

interface LoadingModalProps {
  open: boolean;
}

export default function LoadingModal({ open }: LoadingModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <div className="text-center py-6">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Content</h3>
          <p className="text-gray-600 text-sm mb-4">
            AI is crafting personalized copy for your prospects...
          </p>
          <div className="w-full">
            <Progress value={65} className="w-full" />
            <p className="text-xs text-gray-500 mt-2">This may take a few moments</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
