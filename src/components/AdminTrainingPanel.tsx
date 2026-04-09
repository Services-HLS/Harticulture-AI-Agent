import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import type { Language } from "@/types/agent";
import { vectorStore } from "@/lib/vectorStore";
import { extractTextFromFile } from "@/lib/documentProcessor";

interface TrainingDoc {
  id: string;
  file_name: string;
  file_type: string;
  status: string;
  created_at: string;
  target_role: "district_officer" | "farmer" | null;
}

interface AdminTrainingPanelProps {
  language: Language;
}

export function AdminTrainingPanel({ language }: AdminTrainingPanelProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<TrainingDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [targetRole, setTargetRole] = useState<"district_officer" | "farmer">("district_officer");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isTE = language === "te";

  const loadDocuments = useCallback(async () => {
    const docs = vectorStore.getDocuments();
    setDocuments(docs as any);
    setLoadingDocs(false);
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(true);

    let successCount = 0;
    for (const file of Array.from(files)) {
      try {
        console.log("Local processing for:", file.name);
        
        // 1. Extract text in browser
        const text = await extractTextFromFile(file);
        
        // 2. Generate embeddings and save locally
        await vectorStore.addDocument(
          file.name,
          file.type || file.name.split(".").pop() || "unknown",
          targetRole,
          text
        );

        successCount++;
      } catch (err: any) {
        console.error("Local processing error:", err);
        toast({ 
          title: isTE ? "విఫలమైంది" : "Failed", 
          description: `${file.name}: ${err.message}`, 
          variant: "destructive" 
        });
      }
    }

    setUploading(false);
    loadDocuments();
    
    if (successCount > 0) {
      toast({ title: isTE ? "పూర్తయింది" : "Success", description: `${successCount} file(s) processed locally.` });
    }
  };

  const handleDelete = async (doc: TrainingDoc) => {
    vectorStore.deleteDocument(doc.id);
    loadDocuments();
    toast({ title: isTE ? "తొలగించబడింది" : "Deleted" });
  };

  const roles = [
    { value: "district_officer" as const, labelEn: "Officer", labelTe: "అధికారి", icon: "📊" },
    { value: "farmer" as const, labelEn: "Farmer", labelTe: "రైతు", icon: "🌾" },
  ];

  const acceptedTypes = ".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.pptx,.ppt";

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            {isTE ? "📚 శిక్షణ డేటా నిర్వహణ" : "📚 Training Data Management"}
          </h2>
        </div>

        <div className="bg-secondary/30 p-4 rounded-xl border border-border space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              {isTE ? "శిక్షణ పాత్రను ఎంచుకోండి" : "Select Target Role for Training"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setTargetRole(r.value)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    targetRole === r.value
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <span className="text-lg">{r.icon}</span>
                  <span className="text-sm font-medium">{isTE ? r.labelTe : r.labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground max-w-[200px]">
              {isTE 
                ? "ఎంచుకున్న పాత్రకు సంబంధించిన ఫైల్‌లను అప్‌లోడ్ చేయండి." 
                : "Upload files specific to the selected role above."}
            </p>
            <Button
              variant="agent"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-6 shadow-lg"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span className="ml-2">{isTE ? "అప్‌లోడ్" : "Upload Now"}</span>
            </Button>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          {isTE ? "అప్‌లోడ్ చేసిన పత్రాలు" : "Uploaded Documents"}
        </h3>

        {loadingDocs ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : documents.filter(d => d.target_role === targetRole).length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-card/50">
            <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {isTE ? "ఈ పాత్ర కోసం ఇంకా ఫైల్‌లు అప్‌లోడ్ చేయబడలేదు" : "No documents for this role yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {documents
              .filter((doc) => doc.target_role === targetRole)
              .map((doc) => {
              const docRole = roles.find(r => r.value === doc.target_role);
              return (
                <div
                  key={doc.id}
                  className="group flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-all shadow-sm"
                >
                  <div className="p-2 rounded-lg bg-primary/5 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {doc.file_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary font-medium text-muted-foreground">
                        {doc.file_type.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                      {docRole && (
                        <>
                          <span className="text-[10px] text-muted-foreground">•</span>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-primary">
                            <span>{docRole.icon}</span>
                            <span>{isTE ? docRole.labelTe : docRole.labelEn}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.status === "ready" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : doc.status === "error" ? (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(doc)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-destructive hover:scale-110 transition-transform" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
