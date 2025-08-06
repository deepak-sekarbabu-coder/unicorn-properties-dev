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
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function FaultReportingForm({ onReport }: { onReport?: () => void }) {
  const { user } = useAuth();
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');
    setUploading(true);

    const uploadPromises: Promise<string>[] = [];
    const newErrors: string[] = [];

    for (const file of Array.from(files)) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        newErrors.push(`File "${file.name}" is not a supported image type.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        newErrors.push(`File "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
        continue;
      }
      const path = `faults/${Date.now()}_${file.name}`;
      uploadPromises.push(uploadImage(file, path));
    }

    if (newErrors.length > 0) {
      setError(newErrors.join('\n'));
      setUploading(false);
      return;
    }

    try {
      const urls = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...urls]);
      toast({
        title: 'Image Uploaded',
        description: 'Your image(s) have been successfully uploaded.',
      });
    } catch (err) {
      setError('Image upload failed. Please try again.');
      toast({
        title: 'Upload Failed',
        description: 'There was an error uploading your image(s).',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    try {
      if (!user) throw new Error('Not authenticated');
      if (!location.trim() || !description.trim()) throw new Error('All fields required');
      
      await addFault({
        images,
        location,
        description,
        reportedBy: user.id,
      });
      setLocation('');
      setDescription('');
      setImages([]);
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
              Attach Images <span className="text-xs text-muted-foreground">(Max {MAX_FILE_SIZE_MB}MB per image, .jpg, .jpeg, .png, .webp)</span>
            </label>
            <Input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              multiple
              onChange={handleImageChange}
              disabled={uploading}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {images.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={img}
                  alt="Fault preview"
                  className="w-16 h-16 object-cover rounded border"
                />
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