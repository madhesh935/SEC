"use client";

import * as React from "react";
import { ImageUploader } from "./ImageUploader";
import { AudioUploader } from "./AudioUploader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Image, Mic } from "lucide-react";

export interface MediaUploaderProps {
  onImageUploaded?: (url: string) => void;
  onAudioUploaded?: (url: string) => void;
  patientId?: string;
}

export function MediaUploader({
  onImageUploaded,
  onAudioUploaded,
  patientId,
}: MediaUploaderProps) {
  return (
    <Tabs defaultValue="image" className="w-full">
      <TabsList className="mb-3">
        <TabsTrigger value="image" className="gap-1.5 text-xs">
          <Image className="h-3.5 w-3.5" />
          <span>Photograph</span>
        </TabsTrigger>
        <TabsTrigger value="audio" className="gap-1.5 text-xs">
          <Mic className="h-3.5 w-3.5" />
          <span>Voice Audio</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="image">
        <ImageUploader onSuccess={onImageUploaded} patientId={patientId} />
      </TabsContent>

      <TabsContent value="audio">
        <AudioUploader onSuccess={onAudioUploaded} patientId={patientId} />
      </TabsContent>
    </Tabs>
  );
}
