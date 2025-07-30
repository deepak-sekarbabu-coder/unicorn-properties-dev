'use client';

import { useAuth } from '@/context/auth-context';

import React, { useState } from 'react';

import { addFault } from '@/lib/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function FaultReportingForm({ onReport }: { onReport?: () => void }) {
  const { user } = useAuth();
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileReaders: Promise<string>[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      fileReaders.push(
        new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        })
      );
    }
    Promise.all(fileReaders).then(imgs => setImages([...images, ...imgs]));
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
      if (onReport) onReport();
    } catch (err: any) {
      setError(err.message || 'Failed to report fault');
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
            <label className="block font-medium mb-1">Attach Images</label>
            <Input type="file" accept="image/*" multiple onChange={handleImageChange} />
            <div className="flex flex-wrap gap-2 mt-2">
              {images.map((img, i) => (
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
          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? 'Submitting...' : 'Submit Fault'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
