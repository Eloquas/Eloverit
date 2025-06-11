import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Edit, Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContentPreviewModalProps {
  content: any;
  open: boolean;
  onClose: () => void;
}

export default function ContentPreviewModal({ content, open, onClose }: ContentPreviewModalProps) {
  const { toast } = useToast();

  if (!content) return null;

  const handleCopy = () => {
    const textToCopy = content.subject 
      ? `Subject: ${content.subject}\n\n${content.content}`
      : content.content;
    
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied to clipboard!",
      description: "Content has been copied to your clipboard",
    });
  };

  const handleExport = () => {
    const textToExport = content.subject 
      ? `Subject: ${content.subject}\n\n${content.content}`
      : content.content;
    
    const blob = new Blob([textToExport], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${content.type}-${content.prospectName.replace(/\s+/g, '-')}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Content exported!",
      description: "File has been downloaded to your device",
    });
  };

  const getTypeColor = (type: string) => {
    return type === "email" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Content Preview</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Badge className={`capitalize ${getTypeColor(content.type)}`}>
              {content.type}
            </Badge>
            <span className="text-sm text-gray-500">
              {content.prospectName} - {content.prospectCompany}
            </span>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-80 overflow-y-auto">
            {content.subject && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-1">Subject:</p>
                <p className="text-sm text-gray-800">{content.subject}</p>
                <hr className="my-3 border-gray-300" />
              </div>
            )}
            <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
              {content.content}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-800 space-y-1">
              <p><strong>Tone:</strong> {content.tone}</p>
              <p><strong>Call to Action:</strong> {content.cta}</p>
              {content.context && <p><strong>Context:</strong> {content.context}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCopy}
              className="bg-accent text-white hover:bg-green-700 border-accent"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy to Clipboard
            </Button>
            <Button 
              size="sm"
              onClick={handleExport}
              className="bg-primary hover:bg-primary-dark"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
