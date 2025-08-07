'use client';

import { useAuth } from '@/context/auth-context';

import React, { useState } from 'react';

import { addFault } from '@/lib/firestore';
import { uploadImage } from '@/lib/storage';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // 2MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

export function FaultReportingForm({ onReport }: { onReport?: () => void }) {
  const { user } = useAuth();
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    for (const file of Array.from(files)) {
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        newErrors.push(`File "${file.name}" is not a supported type.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        newErrors.push(`File "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (newErrors.length > 0) {
      setError(newErrors.join('\n'));
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Create preview URLs for display
    const previewUrls = validFiles.map(file => URL.createObjectURL(file));
    setUploadedUrls(prev => [...prev, ...previewUrls]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    
    try {
      if (!user) throw new Error('Not authenticated');
      if (!location.trim() || !description.trim()) throw new Error('All fields required');

      // Upload files to Firebase Storage
      const uploadPromises = selectedFiles.map((file, index) => {
        const path = `faults/${Date.now()}_${index}_${file.name}`;
        return uploadImage(file, path);
      });

      let imageUrls: string[] = [];
      if (uploadPromises.length > 0) {
        imageUrls = await Promise.all(uploadPromises);
      }

      await addFault({
        images: imageUrls,
        location,
        description,
        reportedBy: user.id,
      });
      
      // Clean up preview URLs
      uploadedUrls.forEach(url => URL.revokeObjectURL(url));
      
      setLocation('');
      setDescription('');
      setSelectedFiles([]);
      setUploadedUrls([]);
      toast({
        title: 'Fault Reported',
        description: 'Your fault report has been submitted successfully.',
      });
      if (onReport) onReport();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to report fault');
      toast({
        title: 'Report Failed',
        description: 'There was an error submitting your fault report.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto w-full">
      <CardHeader>
        <CardTitle>Report a Fault</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block font-medium mb-1">Location</label>
            <Input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. 2nd Floor, Kitchen, Room 5"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Description</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the fault in detail"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">
              Attach Files{' '}
              <span className="text-xs text-muted-foreground">
                (Max {MAX_FILE_SIZE_MB}MB per file, .jpg, .jpeg, .png, .webp, .pdf)
              </span>
            </label>
            <Input
              type="file"
              accept={ACCEPTED_FILE_TYPES.join(',')}
              multiple
              onChange={handleFileChange}
              disabled={uploading}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {uploadedUrls.map((fileUrl, i) => (
                fileUrl.includes('.pdf') || selectedFiles[i]?.type === 'application/pdf'
                  ? <a key={i} href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">PDF {i+1}</a>
                  : <img key={i} src={fileUrl} alt="Fault preview" className="w-16 h-16 object-cover rounded border" />
              ))}
            </div>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <Button type="submit" disabled={uploading} className="w-full">
            {uploading ? (
              <span className="flex items-center gap-2 justify-center">
                <Spinner className="w-4 h-4" /> Reporting...
              </span>
            ) : (
              'Report Fault'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
